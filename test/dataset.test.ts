import { readFileSync, writeFileSync } from 'fs';
import { hrtime } from 'process';

import c from 'ansi-colors';
import { expect } from 'chai';
import type { ABI } from 'solc';

import { Contract, ERCIds, JUMPDEST, Shanghai, sol, type Opcode, type State } from 'sevm';
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

    const coverageStats = {
        unreachableJumpDestChunks: 0,
        unreachableJumpDestSize: 0,
        nchunks: 0,
        append({ unreachableJumpDestChunks, unreachableJumpDestSize, nchunks }: ReturnType<typeof coverage>) {
            this.unreachableJumpDestChunks += unreachableJumpDestChunks;
            this.unreachableJumpDestSize += unreachableJumpDestSize;
            this.nchunks += nchunks;
        },
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

                coverageStats.append(coverage(contract, this));
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
        type Fun = (str: string) => string;

        const error = c.red;
        const warn = c.yellow;

        function getSummary(enableColors: boolean, heading: Fun, item: Fun, info: Fun, emph: Fun, code: Fun) {
            const enabled = c.enabled;

            c.enabled = enableColors;

            let summary = '';
            const write = (text: string) => summary += text + '\n';

            const showErr = (count: number) => `${count === 1 ? '' : warn(`(x${count})`)}`;
            write(heading(`\u{26A0}\u{FE0F} Symbolic Execution Errors - ${emph(`${errorsByReasonCount} errors of ${errorsByReason.size} kinds`)} (in ${emph(`${errorsByContract.size}`)} contracts)`));
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

            write(heading('\u{26A1} Bench Stats'));
            for (const bench of [execStats, solStats, yulStats]) {
                let out = '';
                out += `${'average'} ${emph(`${(bench.average / 1_000_000).toFixed(1)} ms`)}`;
                out += ` (${'total'} ${emph(`${bench.total / 1_000_000n} ms`)})`;
                write(item(`${info(bench.name)} ${out}`));
            }

            const cc = (def: string) => ([k, v]: [string, number]) => `${code(k !== '' ? k : def)}${emph(`(${v})`)}`;
            write(heading('\u{1F3F7} \u{FE0F} Metadata Stats'));
            write(item(`${info('No metadata')} ${emph(`(${metadataStats.noMetadata})`)}`));
            write(item(`${info('Protocols')} ${[...metadataStats.protocols.sorted()].map(cc('<no protocol>')).join(' ')}`));
            write(item(`${info('SOLC versions')} ${[...metadataStats.solcs.sorted()].map(cc('<no version>')).join(' ')}`));

            write(heading('\u{1F4DC} Bytecode Stats'));
            write(item(`${info('Selectors')} Missed selectors ${emph(`(${selectorStats.missedSelectors.size})`)} | Hit selectors ${emph(`(${selectorStats.hitSelectors.size})`)} `));
            write(item(`${info('ERCs')} ${emph(`(most used first)`)} ` + ercsStats.counts.sorted().map(([erc, count]) => `${code(erc)}${emph(`(${count})`)}`).join(' | ')));
            write(item(`${info('Precompiled Contracts')} ${emph(`(most used first)`)} ` + hookStats.precompiles.sorted().map(([address, count]) => `${code(address)}${emph(`(${count})`)}`).join(' | ')));
            write(item(`${code('PC')}s ${emph(`(${hookStats.pcs})`)}`));
            write(item(`${info('Coverage')} \u{1F6A7} ${fmt(coverageStats.unreachableJumpDestChunks)}/${fmt(coverageStats.nchunks)} unreacheable chunks ${emph(`(${(coverageStats.unreachableJumpDestSize / 1024).toFixed(1)}k)`)}`));

            const revertSelectors = hookStats.revertSelectors.sorted();
            const displayCount = 15;
            write(item(`${info('Revert Selectors')} ${emph(`(most used first)`)} ` + revertSelectors.slice(0, displayCount).map(([selector, count]) => `${code(selector)}${emph(`(${count})`)}`).join(' | ')));
            if (revertSelectors.length > displayCount)
                write('    ' + emph(`...${revertSelectors.length - displayCount} more revert selectors`));

            c.enabled = enabled;
            return summary;
        }

        console.info(getSummary(true,
            s => `\n  ${s}`,
            s => `    • ${s}`,
            c.cyan,
            c.magenta,
            s => s,
        ));
        writeFileSync(`dist/dataset-summary.md`, '## Contract Dataset Summary\n\n' + getSummary(false,
            s => `\n### ${s}`,
            s => `- ${s}`,
            s => `**${s}**`,
            s => `_${s}_`,
            s => `\`${s}\``,
        ).trimStart(), 'utf-8');
    });
});

/**
 * Determines bytecode coverage for `contract`.
 * 
 * @param contract the `Contract` to get coverage information from.
 * @param ctx The Mocha context to update running test `title`.
 * @returns 
 */
function coverage(contract: Contract, ctx: Mocha.Context): {
    unreachableJumpDestChunks: number,
    unreachableJumpDestSize: number,
    nchunks: number,
} {
    let nopcodes = 0;
    let unreachableJumpDestChunks = 0;
    let unreachableJumpDestSize = 0;
    const chunks = contract.chunks();
    for (const chunk of chunks) {
        if (chunk.content instanceof Uint8Array) {
            expect(chunk.states).to.be.undefined;
            expect(chunk.content.length).to.be.above(0);
            if (chunk.content[0] === JUMPDEST) {
                unreachableJumpDestChunks++;
                unreachableJumpDestSize += chunk.content.length;
            }
        } else {
            const block = contract.blocks.get(chunk.pcbegin);
            expect(chunk.states).to.not.be.undefined;
            expect(block).to.not.be.undefined;
            expect(block!.opcodes.length).to.be.equal(chunk.content.length);
            expect(chunk.content.length).to.be.above(0);
            nopcodes += chunk.content.length;
        }
    }

    expect(nopcodes).to.be.equal(contract.opcodes().length);
    if (unreachableJumpDestChunks > 0)
        ctx.test!.title += ` \u{1F6A7}${fmt(unreachableJumpDestChunks)}/${fmt(chunks.length)} (${unreachableJumpDestSize}b)`;

    return { unreachableJumpDestChunks, unreachableJumpDestSize, nchunks: chunks.length };
}

function fmt(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
}
