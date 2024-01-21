import { existsSync, readFileSync, writeFileSync } from 'fs';
import { hrtime } from 'process';

import c from 'ansi-colors';
import { expect } from 'chai';
import { CloudflareProvider, EtherscanProvider, InfuraProvider } from 'ethers';

import { Contract, ERCIds, Shanghai, sol, type State } from 'sevm';
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

const ENABLE_ETHERSCAN_TEST = process.env['ENABLE_ETHERSCAN_TEST'];
const hint = !ENABLE_ETHERSCAN_TEST ? ' (enable it by setting `ENABLE_ETHERSCAN_TEST`)' : '';

describe(`::etherscan | MAX=\`${MAX ?? ''}\` CONTRACT=\`${CONTRACT}\`${hint}`, function () {
    this.bail(true);

    if (!ENABLE_ETHERSCAN_TEST) {
        it('(Etherscan test must be manually enabled) ', function () {
            this.skip();
        });
        return;
    };

    const BASE_PATH = '.etherscan';

    const csvPath = `${BASE_PATH}/$export-verified-contractaddress-opensource-license.csv`;
    let csv: string;
    try {
        /**
         * Needs to be manually downloaded from
         * https://etherscan.io/exportData?type=open-source-contract-codes
         */
        csv = readFileSync(csvPath, 'utf8');
    } catch {
        it(`Addresses CSV \`${csvPath}\` not found, skipping`, function () {
            this.skip();
        });
        return;
    }

    // const addr = c.cyan;
    const error = c.red;
    const warn = c.yellow;
    const info = c.blue;

    const provider = {
        providers: [
            new InfuraProvider(),
            new EtherscanProvider(),
            new CloudflareProvider(),
        ],
        current: 0,
        getCode: async function (address: string): Promise<string> {
            this.current = (this.current + 1) % this.providers.length;
            const code = await this.providers[this.current].getCode(address);
            return code;
        },
    };

    const errorsByContract: Map<string, Contract['errors']> = new Map();
    const metadataStats = new (class {
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
    })();

    const benchStats = new (class {
        count = 0;
        total = 0n;

        append(diff: bigint) {
            this.count++;
            this.total += diff;
        }

        get average() {
            return this.count === 0 ? NaN : Number(this.total / BigInt(this.count));
        }
    })();

    const precompiledStats = new (class {
        counts = new Map<string, number>();

        append(address: string) {
            const count = this.counts.get(address) ?? 0;
            this.counts.set(address, count + 1);
        }
    })();

    const contracts = csv
        .trimEnd()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(','))
        .map(([_tx, name, address]) => [name, address])
        .filter(([name, address]) => CONTRACT === undefined || `${name} ${address}`.match(CONTRACT))
        .slice(0, MAX !== undefined ? parseInt(MAX) : undefined);

    contracts.forEach(([address, name]) => {
        it(`should decompile ${name} ${address}`, async function () {
            const path = `${BASE_PATH}/${name}-${address}.bytecode`;
            if (!existsSync(path)) {
                this.timeout(10000);
                this.test!.title += c.yellow(' \u2913');
                try {
                    const code = await provider.getCode(address);
                    writeFileSync(path, code);
                } catch (err) {
                    console.info(
                        error((err as { message: string }).message),
                        provider.providers[provider.current]
                    );
                }
            } else {
                this.test!.title += ' \u2713';
            }

            const bytecode = readFileSync(path, 'utf8');
            if (bytecode === '0x') {
                return;
            }

            const step = new class extends Shanghai {
                override STATICCALL = (state: State) => {
                    super.STATICCALL(state);
                    const call = state.stack.top as StaticCall;
                    const address = call.address.eval();
                    if (address.tag === 'Val' && address.val <= 9n) {
                        precompiledStats.append(sol`${address}`);
                    }
                };
            }();

            const t0 = hrtime.bigint();
            let contract = new Contract(bytecode);
            const t1 = hrtime.bigint();
            benchStats.append(t1 - t0);

            contract = contract.patchdb();
            contract.solidify();

            metadataStats.append(contract.metadata);
            selectorStats.append(contract.functions);
            ercsStats.append(contract, this);

            if (contract.errors.length > 0) {
                const key = `${name} ${address} ~${(bytecode.length / 1024).toFixed(1)}k v${contract.metadata?.solc}`;
                errorsByContract.set(key, contract.errors);
            }

            const externals = [
                ...Object.values(contract.functions).flatMap(fn =>
                    fn.label !== undefined ? [fn.label] : []
                ),
                ...[...step.variables.values()].flatMap(v =>
                    v.label !== null ? [v.label + '()'] : []
                ),
            ];
            expect(contract.getFunctions().sort()).to.include.members(externals.sort());
        });
    });

    after(function () {
        console.info(`\n  Errors (${warn(`${errorsByContract.size}`)} contracts)`);
        for (const [id, errors] of errorsByContract.entries()) {
            console.info(warn(`    • ${id} - ${errors.length} error(s)`));
            const errorsByReason: Map<string, number> = new Map();
            errors.forEach(({ err }) => {
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

        const cc = ([k, v]: [string, number]) => `${k}(${v})`;
        console.info('\n  Metadata Stats');
        console.info(`    • ${info('No metadata')} ${metadataStats.noMetadata}`);
        console.info(`    • ${info('Protocols')} ${[...metadataStats.protocols.entries()].map(cc).join('|')}`);
        console.info(`    • ${info('SOLC versions')} ${[...metadataStats.solcs.entries()].map(cc).join('|')}`);

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
