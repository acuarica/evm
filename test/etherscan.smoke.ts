import { existsSync, readFileSync, writeFileSync } from 'fs';
import { hrtime } from 'process';

import { expect } from 'chai';
import c from 'ansi-colors';
import { CloudflareProvider, EtherscanProvider, InfuraProvider, PocketProvider } from 'ethers';

import { Contract, ERCIds, sol, type State, STEP } from 'sevm';
import type { Expr, Inst, StaticCall, Throw } from 'sevm/ast';
import 'sevm-4byte';

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

const addr = c.cyan;
const error = c.red;
const warn = c.yellow;
const info = c.blue;

const provider = {
    providers: [
        new InfuraProvider(),
        new EtherscanProvider(),
        new CloudflareProvider(),
        new PocketProvider(),
    ],
    current: 0,
    getCode: async function (address: string): Promise<string> {
        this.current = (this.current + 1) % this.providers.length;
        const code = await this.providers[this.current].getCode(address);
        return code;
    },
};

describe(`etherscan | MAX=\`${MAX ?? ''}\` CONTRACT=\`${CONTRACT}\``, function () {
    this.bail(true);

    const csvPath = 'test/export-verified-contractaddress-opensource-license.csv';
    /** @type {Buffer} */
    let csv;
    try {
        /**
         * Needs to be manually downloaded from
         * https://etherscan.io/exportData?type=open-source-contract-codes
         */
        csv = readFileSync(csvPath);
    } catch {
        it.skip(`Addresses CSV \`${csvPath}\` not found, skipping`, function () {
            /**/
        });
        return;
    }

    const errorsByContract: Map<string, Throw[]> = new Map();
    const metadataStats = new (class {
        noMetadata = 0;
        protocols: Set<string> = new Set();
        solcs = new Set();

        append(metadata: Contract['metadata']) {
            if (metadata) {
                this.protocols.add(metadata.protocol);
                this.solcs.add(metadata.solc);
            } else {
                this.noMetadata++;
            }
        }
    })();

    const selectorStats = new (class {
        hitSelectors = new Set<string>();
        missedSelectors = new Set<string>();

        append(functions: Contract['functions']) {
            for (const fn of Object.values(functions)) {
                (fn.label !== undefined ? this.hitSelectors : this.missedSelectors).add(
                    fn.selector
                );
            }
        }
    })();

    const ercsStats = new (class {
        counts = new Map<(typeof ERCIds)[number], number>();

        append(contract: Contract) {
            for (const erc of ERCIds) {
                if (contract.isERC(erc)) {
                    const count = this.counts.get(erc) ?? 0;
                    this.counts.set(erc, count + 1);
                }
            }
        }
    })();

    const benchStats = new (class {
        count = 0;
        total = 0n;

        append(diff: bigint) {
            this.count++;
            this.total += diff;
        }

        get average() {
            return Number(this.total / BigInt(this.count));
        }
    })();

    const precompiledStats = new (class {
        counts = new Map<string, number>();

        append(address: string) {
            const count = this.counts.get(address) ?? 0;
            this.counts.set(address, count + 1);
        }
    })();

    csv.toString()
        .trimEnd()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(','))
        .filter(
            ([_, name, address]) => CONTRACT === undefined || `${name} ${address}`.match(CONTRACT)
        )
        .slice(0, MAX !== undefined ? parseInt(MAX) : undefined)
        .forEach(([_tx, address, name]) => {
            it(`should decode & decompile ${name} ${address}`, async function () {
                const BASE_PATH = '.etherscan/';
                const path = `${BASE_PATH}${name}-${address}.bytecode`;
                if (!existsSync(path)) {
                    this.timeout(10000);
                    console.log(`Fetching code for ${name} at ${addr(address)} into ${BASE_PATH}`);
                    try {
                        const code = await provider.getCode(address);
                        writeFileSync(path, code);
                    } catch (err) {
                        console.info(
                            error((err as { message: string }).message),
                            provider.providers[provider.current]
                        );
                    }
                }

                const bytecode = readFileSync(path, 'utf8');
                if (bytecode === '0x') {
                    return;
                }

                const step = STEP();
                /** @param {import('sevm').State<import('sevm/ast').Inst, import('sevm/ast').Expr>} state */
                const STATICCALL = (state: State<Inst, Expr>) => {
                    step['STATICCALL'](state);
                    const call = state.stack.top as StaticCall;
                    const address = call.address.eval();
                    if (address.tag === 'Val' && address.val <= 9n) {
                        precompiledStats.append(sol`${address}`);
                    }
                };
                const t0 = hrtime.bigint();
                let contract = new Contract(bytecode, { STATICCALL });
                const t1 = hrtime.bigint();
                benchStats.append(t1 - t0);

                contract = contract.patch();
                contract.decompile();

                metadataStats.append(contract.metadata);
                selectorStats.append(contract.functions);
                ercsStats.append(contract);

                if (contract.evm.errors.length > 0) {
                    errorsByContract.set(`${name}-${address}`, contract.evm.errors);
                }

                const externals = [
                    ...Object.values(contract.functions).flatMap(fn =>
                        fn.label !== undefined ? [fn.label] : []
                    ),
                    ...Object.values(contract.evm.variables).flatMap(v =>
                        v.label !== undefined ? [v.label + '()'] : []
                    ),
                ];
                expect(contract.getFunctions().sort()).to.include.members(externals.sort());
            });
        });

    after(function () {
        console.info(`\n  Errors (${warn(`${errorsByContract.size}`)} contracts)`);
        for (const [id, errors] of errorsByContract.entries()) {
            console.info(warn(`    • ${id} - ${errors.length} error(s)`));
            /** @type {Map<string, number>} */
            const errorsByReason = new Map();
            errors.forEach(err => {
                const count = errorsByReason.get(err.reason) ?? 0;
                errorsByReason.set(err.reason, count + 1);
            });
            for (const [reason, count] of errorsByReason) {
                console.info(
                    '        ' + error('x'),
                    reason,
                    count === 1 ? '' : warn(`(x${count})`)
                );
            }
        }

        console.info('\n  Metadata Stats');
        console.info(`    • ${info('No metadata')} ${metadataStats.noMetadata}`);
        console.info(`    • ${info('Protocols')} ${[...metadataStats.protocols].join('|')}`);
        console.info(`    • ${info('SOLC versions')} ${[...metadataStats.solcs].join('|')}`);

        console.info('\n  Selector Stats');
        console.info(`    • ${info('Hit selectors')} ${selectorStats.hitSelectors.size}`);
        console.info(`    • ${info('Missed selectors')} ${selectorStats.missedSelectors.size}`);

        console.info('\n  ERCs Stats');
        for (const [erc, count] of ercsStats.counts) {
            console.info(`    • ${info(erc)} ${count}`);
        }

        console.info('\n  Bench Stats');
        console.info(`    • ${info('Total')} ${warn(`${benchStats.total / 1_000_000n} ms`)}`);
        console.info(`    • ${info('Average')} ${warn(`${benchStats.average / 1_000_000} ms`)}`);

        console.info('\n  Precompiled Contract Stats');
        for (const [address, count] of precompiledStats.counts) {
            console.info(`    • ${info(address)} ${count}`);
        }
    });
});
