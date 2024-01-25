import { readFileSync, writeFileSync } from 'fs';
import { hrtime } from 'process';

import c from 'ansi-colors';
import { expect } from 'chai';

import { Contract, ERCIds, type Opcode, Shanghai, sol, type State } from 'sevm';
import type { StaticCall } from 'sevm/ast';
import 'sevm/4bytedb';

/**
 * 
 */
class MultiSet<T> {
    _map = new Map<T, number>();

    add(key: T) {
        const count = this._map.get(key) ?? 0;
        this._map.set(key, count + 1);
    }

    get(key: T): number {
        return this._map.get(key) ?? 0;
    }

    entries() {
        return this._map.entries();
    }
}

/**
 * Restricts the number of Etherscan contracts to test.
 * If provided, tests only the first `MAX` contracts.
 * Otherwise, tests all contracts.
 */
const MAX = process.env['MAX'];

/**
 * Filters the Etherscan contracts to test.
 * If provided, tests the contracts where their names matches `CONTRACT`.
 * Otherwise, tests all contracts.
 */
const CONTRACT = process.env['CONTRACT'];

/**
 * Enable this to make test bail after first error.
 */
const BAIL = process.env['BAIL'];

const ENABLE_DATASET_TEST = process.env['ENABLE_DATASET_TEST'];
const hint = !ENABLE_DATASET_TEST ? ' (enable it by setting `ENABLE_DATASET_TEST`)' : '';

describe(`::dataset | MAX=\`${MAX ?? ''}\` CONTRACT=\`${CONTRACT ?? ''}\` BAIL=\`${BAIL ?? ''}\`${hint}`, function () {
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

    const error = c.red;
    const warn = c.yellow;
    const info = c.blue;

    const errorsByContract: Map<string, Contract['errors']> = new Map();
    const metadataStats = new class {
        noMetadata = 0;
        protocols = new MultiSet<string>();
        solcs = new MultiSet<string>();

        append(metadata: Contract['metadata']) {
            if (metadata) {
                this.protocols.add(metadata.protocol);
                this.solcs.add(metadata.solc);
            } else {
                this.noMetadata++;
            }
        }
    }();

    const selectorStats = new class {
        hitSelectors = new Set<string>();
        missedSelectors = new Set<string>();

        append(functions: Contract['functions']) {
            for (const fn of Object.values(functions)) {
                (fn.label !== undefined ? this.hitSelectors : this.missedSelectors).add(fn.selector);
            }
        }
    }();

    const ercsStats = new class {
        counts = new Map<(typeof ERCIds)[number], number>();

        append(contract: Contract, ctx: Mocha.Context) {
            const ercs = [];
            for (const erc of ERCIds) {
                if (contract.isERC(erc)) {
                    const count = this.counts.get(erc) ?? 0;
                    this.counts.set(erc, count + 1);
                    ercs.push(erc);
                }
            }
            if (ercs.length > 0)
                ctx.test!.title += ' ' + c.bold(`ERC:${ercs.map(erc => erc.substring(3)).join('|')}`);
        }
    }();

    const benchStats = new class {
        count = 0;
        total = 0n;

        append(diff: bigint) {
            this.count++;
            this.total += diff;
        }

        get average() {
            return this.count === 0 ? NaN : Number(this.total / BigInt(this.count));
        }
    }();

    const hookStats = new class {
        pcs = 0;

        staticcalls = new Map<string, number>();

        precompile(address: string) {
            const count = this.staticcalls.get(address) ?? 0;
            this.staticcalls.set(address, count + 1);
        }
    }();

    const contracts = csv
        .trimEnd()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(','))
        .filter(([name, address]) => CONTRACT === undefined || `${name} ${address}`.match(CONTRACT))
        .slice(0, MAX !== undefined ? parseInt(MAX) : undefined);

    contracts.forEach(([address, name]) => {
        it(`should decompile ${name} ${address}`, function () {
            // Increase timeout to pass in CI
            this.timeout(10000);

            const path = `${BASE_PATH}/1/${name}-${address}.bytecode`;

            const bytecode = readFileSync(path, 'utf8');
            if (bytecode === '0x') {
                this.test!.title += ' 🚫';
                return;
            }

            const t0 = hrtime.bigint();
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
                        hookStats.precompile(sol`${address}`);
                    }
                };
            }());
            const t1 = hrtime.bigint();
            benchStats.append(t1 - t0);

            contract = contract.patchdb();
            expect(contract.solidify()).to.be.not.empty;
            expect(contract.yul()).to.be.not.empty;

            metadataStats.append(contract.metadata);
            selectorStats.append(contract.functions);
            ercsStats.append(contract, this);

            if (contract.errors.length > 0) {
                const v = contract.metadata ? `v${contract.metadata?.solc}` : '<no version>';
                const key = `${name} ${address} ~${(bytecode.length / 1024).toFixed(1)}k ${v}`;
                errorsByContract.set(key, contract.errors);
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
        function getSummary(enableColors: boolean) {
            const enabled = c.enabled;

            c.enabled = enableColors;

            let summary = '';
            const write = (text: string) => summary += text + '\n';

            write(`\n  Symbolic Execution Errors (${warn(`${errorsByContract.size}`)} contracts)`);
            for (const [id, errors] of errorsByContract.entries()) {
                write(warn(`    • ${id} - ${errors.length} error(s)`));
                const errorsByReason: Map<string, number> = new Map();
                errors.forEach(({ err }) => {
                    const count = errorsByReason.get(err.reason) ?? 0;
                    errorsByReason.set(err.reason, count + 1);
                });
                for (const [reason, count] of errorsByReason) {
                    write(`        ${error('x')} ${reason} ${count === 1 ? '' : warn(`(x${count})`)}`);
                }
            }

            const cc = ([k, v]: [string, number]) => `${k}(${v})`;
            write('\n  Metadata Stats');
            write(`    • ${info('No metadata')} ${metadataStats.noMetadata}`);
            write(`    • ${info('Protocols')} ${[...metadataStats.protocols.entries()].map(cc).join('|')}`);
            write(`    • ${info('SOLC versions')} ${[...metadataStats.solcs.entries()].map(cc).join('|')}`);

            write('\n  Selector Stats');
            write(`    • ${info('Hit selectors')} ${selectorStats.hitSelectors.size}`);
            write(`    • ${info('Missed selectors')} ${selectorStats.missedSelectors.size}`);

            write('\n  ERCs Stats');
            for (const [erc, count] of ercsStats.counts) {
                write(`    • ${info(erc)} ${count}`);
            }

            write('\n  Bench Stats');
            write(`    • ${info('Total')} ${warn(`${benchStats.total / 1_000_000n} ms`)}`);
            write(`    • ${info('Average')} ${warn(`${benchStats.average / 1_000_000} ms`)}`);

            write('\n  Precompiled Contract Stats');
            for (const [address, count] of hookStats.staticcalls) {
                write(`    • ${info(address)} ${count}`);
            }
            write('\n  PC Stats');
            write(`    • ${info('PCs')} ${hookStats.pcs}`);

            c.enabled = enabled;
            return summary;
        }

        console.info(getSummary(true));
        writeFileSync(`dist/dataset-summary.txt`, getSummary(false).trimStart(), 'utf-8');
    });
});
