import { readFileSync, writeFileSync } from 'fs';
import { hrtime } from 'process';

import c from 'ansi-colors';
import { expect } from 'chai';
import type { ABI } from 'solc';

import { Contract, ERCIds, Shanghai, sol, type Opcode, type State } from 'sevm';
import 'sevm/4bytedb';
import type { StaticCall, Revert } from 'sevm/ast';
import { fnselector } from './utils/selector';

/**
 * 
 */
class MultiSet<T> {
    _map = new Map<T, number>();
    total = 0;

    add(key: T) {
        const count = this._map.get(key) ?? 0;
        this._map.set(key, count + 1);
        this.total++;
    }

    get(key: T): number {
        return this._map.get(key) ?? 0;
    }

    sorted() {
        return [...this._map.entries()].sort((x, y) => y[1] - x[1]);
    }

    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }
}

class BenchStats {
    count = 0;
    total = 0n;

    constructor(readonly name: string) { }

    append(diff: bigint) {
        this.count++;
        this.total += diff;
    }

    get average() {
        return this.count === 0 ? NaN : Number(this.total / BigInt(this.count));
    }
}

/**
 * Restricts the number of Etherscan contracts to test.
 * If provided, tests only the first `MAX` contracts.
 * Otherwise, tests all contracts.
 */
const MAX = process.env['MAX'];

/**
 * Enable this to make test bail after first error.
 */
const BAIL = process.env['BAIL'];

const ENABLE_DATASET_TEST = process.env['ENABLE_DATASET_TEST'];
const hint = !ENABLE_DATASET_TEST ? ' (enable it by setting `ENABLE_DATASET_TEST`)' : '';

describe(`::dataset | MAX=\`${MAX ?? ''}\` BAIL=\`${BAIL ?? ''}\`${hint}`, function () {
    if (BAIL) this.bail();

    if (!ENABLE_DATASET_TEST) {
        it('(Contract dataset test must be manually enabled) ', function () {
            this.skip();
        });
        return;
    };

    const BASE_PATH = '.dataset';

    const csvPath = `${BASE_PATH}/export-verified-contractaddress-opensource-license.csv`;
    const csv = readFileSync(csvPath, 'utf8');

    let errorsByReasonCount = 0;
    const errorsByReason = new Map<string, MultiSet<string>>();
    const errorsByContract = new Map<string, Contract['errors']>();
    const metadataStats = {
        noMetadata: 0,
        protocols: new MultiSet<string>(),
        solcs: new MultiSet<string>(),
        append(metadata: Contract['metadata']) {
            if (metadata) {
                this.protocols.add(metadata.protocol);
                this.solcs.add(metadata.solc);
            } else {
                this.noMetadata++;
            }
        }
    };

    const selectorStats = {
        hitSelectors: new Set<string>(),
        missedSelectors: new Set<string>(),
        append(functions: Contract['functions']) {
            for (const fn of Object.values(functions)) {
                (fn.label !== undefined ? this.hitSelectors : this.missedSelectors).add(fn.selector);
            }
        }
    };

    const ercsStats = {
        counts: new MultiSet<(typeof ERCIds)[number]>(),
        append(contract: Contract, ctx: Mocha.Context) {
            const ercs = [];
            for (const erc of ERCIds) {
                if (contract.isERC(erc)) {
                    this.counts.add(erc);
                    ercs.push(erc);
                }
            }
            if (ercs.length > 0)
                ctx.test!.title += ' ' + c.bold(`ERC:${ercs.map(erc => erc.substring(3)).join('|')}`);
        }
    };

    const execStats = new BenchStats('Contract decode & execution');
    const solStats = new BenchStats('Generate Solidity source');
    const yulStats = new BenchStats('Generate Yul source');

    const hookStats = {
        pcs: 0,
        precompiles: new MultiSet<string>(),
        revertSelectors: new MultiSet<string>(),
    };

    const contracts = csv
        .trimEnd()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(','))
        .slice(0, MAX !== undefined ? parseInt(MAX) : undefined);

    contracts.forEach(([address, name]) => {
        it(`${name} ${address}`, function () {
            // Increase timeout to pass in CI
            this.timeout(60000);

            const path = `${BASE_PATH}/1/${name}-${address}.bytecode`;

            const bytecode = readFileSync(path, 'utf8');
            if (bytecode === '0x') {
                this.test!.title += ' 🚫';
                return;
            }
            const size = `~${(bytecode.length / 1024).toFixed(1)}k`;
            this.test!.title += ` ${size}`;

            let t0 = hrtime.bigint();
            let contract = new Contract(bytecode, new class extends Shanghai {
                override PC = (state: State, opcode: Opcode) => {
                    super.PC(state, opcode);
                    hookStats.pcs++;
                };

                override STATICCALL = (state: State) => {
                    super.STATICCALL(state);
                    const call = state.stack.top as StaticCall;
                    const address = call.address.eval();
                    if (address.tag === 'Val' && address.val <= 9n) {
                        hookStats.precompiles.add(sol`${address}`);
                    }
                };

                override REVERT = (state: State) => {
                    super.REVERT(state);
                    const revert = state.last as Revert;
                    if (revert.selector !== undefined) {
                        hookStats.revertSelectors.add(revert.selector);
                    }
                };
            }());
            let t1 = hrtime.bigint();
            execStats.append(t1 - t0);

            contract = contract.patchdb();

            t0 = hrtime.bigint();
            const solSrc = contract.solidify();
            expect(solSrc).to.be.not.empty;
            t1 = hrtime.bigint();
            solStats.append(t1 - t0);

            t0 = hrtime.bigint();
            const yulSrc = contract.yul();
            expect(yulSrc).to.be.not.empty;
            t1 = hrtime.bigint();
            yulStats.append(t1 - t0);

            metadataStats.append(contract.metadata);
            selectorStats.append(contract.functions);
            ercsStats.append(contract, this);

            if (contract.errors.length > 0) {
                const v = contract.metadata ? `v${contract.metadata?.solc}` : '<no version>';
                const key = `${name} ${address} ${size} ${v}`;
                errorsByContract.set(key, contract.errors);

                errorsByReasonCount += contract.errors.length;
                contract.errors.forEach(({ err }) => {
                    const reason = err.reason
                        // Mask PC in `JUMP` related errors.
                        .replace(/^JUMP\(0x56\)@\d+ /, 'JUMP(0x56)@<pc> ')
                        // Mask local variable indexes when an `Expr` is shown.
                        .replace(/local\d+/g, 'local<n>');
                    let errors;
                    if ((errors = errorsByReason.get(reason)) === undefined) {
                        errors = new MultiSet<string>();
                        errorsByReason.set(reason, errors);
                    }
                    errors.add(key);
                });

                this.test!.title += c.yellow(' ⧧\u2717');
            } else {
                const abiPath = `${BASE_PATH}/1/${name}-${address}.abi.json`;
                const abi = JSON.parse(readFileSync(abiPath, 'utf8')) as ABI | null;
                if (abi !== null) {
                    const selectors = abi
                        .filter(m => m.type === 'function')
                        .map(fn => fnselector(fn));
                    expect(Object.keys(contract.functions).sort()).to.have.members(selectors.sort());
                    this.test!.title += ` {}\u2713`;
                } else {
                    this.test!.title += c.yellow(' {}-');
                }
            }

            const externals = [
                ...Object.values(contract.functions).flatMap(fn =>
                    fn.label !== undefined ? [fn.label] : []
                ),
                ...[...contract.variables.values()].flatMap(v =>
                    v.label !== null ? [v.label + '()'] : []
                ),
            ];
            expect(contract.getFunctions().sort()).to.include.members(externals.sort());
        });
    });

    after(function () {
        const error = c.red;
        const warn = c.yellow;
        const info = c.cyan;

        function getSummary(enableColors: boolean) {
            const enabled = c.enabled;

            c.enabled = enableColors;

            let summary = '';
            const write = (text: string) => summary += text + '\n';

            const showErr = (count: number) => `${count === 1 ? '' : warn(`(x${count})`)}`;
            write(`\n  Symbolic Execution Errors - ${warn(`${errorsByReasonCount} errors of ${errorsByReason.size} kinds`)} (in ${warn(`${errorsByContract.size}`)} contracts)`);
            for (const [reason, addresses] of errorsByReason.entries()) {
                write(`    ${error('x')} ${reason} - ${warn(`${addresses.total} error(s)`)}`);
                const addrs = [...addresses];
                const displayCount = 10;
                for (const [contract, count] of addrs.slice(0, displayCount)) {
                    write(`      ${warn('•')} ${`${contract} ${showErr(count)}`}`);
                }
                if (addrs.length > displayCount)
                    write(c.dim(`    ... ${addrs.length - displayCount} more contracts`));
            }

            write('\n  Bench Stats');
            for (const bemch of [execStats, solStats, yulStats]) {
                let out = '';
                out += `${'average'} ${c.magenta(`${(bemch.average / 1_000_000).toFixed(1)} ms`)}`;
                out += ` (${'total'} ${c.magenta(`${bemch.total / 1_000_000n} ms`)})`;
                write(`    • ${info(bemch.name)} ${out}`);
            }

            const cc = ([k, v]: [string, number]) => `${k}(${v})`;
            write('\n  Metadata Stats');
            write(`    • ${info('No metadata')} ${metadataStats.noMetadata}`);
            write(`    • ${info('Protocols')} ${[...metadataStats.protocols].map(cc).join('|')}`);
            write(`    • ${info('SOLC versions')} ${[...metadataStats.solcs].map(cc).join('|')}`);

            write(`\n  Selector Stats`);
            write(`    ${info('Hit selectors')}(${selectorStats.hitSelectors.size}) | ${info('Missed selectors')}(${selectorStats.missedSelectors.size})`);

            write(`\n  ERCs Stats`);
            write(`    ${[...ercsStats.counts].map(([erc, count]) => `${info(erc)}(${count})`).join(' | ')}`);

            write(`\n  Precompiled Contract Stats`);
            write(`    ${[...hookStats.precompiles].map(([address, count]) => `${info(address)}(${count})`).join(' | ')}`);

            write(`\n  PC Stats`);
            write(`    ${info('PCs')}(${hookStats.pcs})`);

            write(`\n  Revert Selector Stats`);
            const revertSelectors = hookStats.revertSelectors.sorted();
            const displayCount = 15;
            const sels = revertSelectors.slice(0, displayCount).map(([selector, count]) =>  `${info(selector)}(${count})`).join(' | ');
            write(`    ${sels}`);
            if (revertSelectors.length > displayCount)
                write(c.dim(`    ... ${revertSelectors.length - displayCount} more revert selectors`));

            c.enabled = enabled;
            return summary;
        }

        console.info(getSummary(true));
        writeFileSync(`dist/dataset-summary.txt`, getSummary(false).trimStart(), 'utf-8');
    });
});
