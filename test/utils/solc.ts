/* eslint-disable mocha/no-exports */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import type { Runnable, Suite } from 'mocha';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupMethods } = require('solc');

export const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16'] as const;

type Version = (typeof VERSIONS)[number];

type Bytecode = {
    object: string;
    opcodes: string;
    sourceMap: string;
};

type ABI = {
    type: 'function' | 'event';
    name: string;
    inputs: {
        name: string;
        type: string;
    }[];
}[];

type SolcOutput = {
    contracts: {
        SOURCE: {
            [contractName: string]: {
                abi: ABI;
                evm: { bytecode: Bytecode; deployedBytecode: Bytecode };
            };
        };
    };
    sources: { SOURCE: { id: 0 } }; // Not currently used
    errors?: {
        severity: string;
        formattedMessage: string;
    }[];
};

const SEVERITY = {
    error: 1,
    warning: 2,
    info: 3,
};

const versionsLoaded = new Set<Version>();

/**
 *
 * https://docs.soliditylang.org/en/v0.8.16/using-the-compiler.html#compiler-input-and-output-json-description
 *
 * @param contractName
 * @param content
 * @param version
 * @returns
 */
export function compile(
    content: string,
    version: Version,
    opts: {
        severity?: keyof typeof SEVERITY;
        contractName?: string;
        context?: Mocha.Context;
    } = {}
): { bytecode: string; abi: ABI } {
    content = `// SPDX-License-Identifier: MIT\npragma solidity ${version};\n${content}`;

    let writeCacheFn: (output: ReturnType<typeof compile>) => void;
    if (opts.context !== undefined) {
        const basePath = './.artifacts';
        const fileName = title(opts.context.test)
            .replace(/^../, '')
            .replace('solc-', '')
            .replace(/`/g, '')
            .replace(/::/g, '.')
            .replace(/ /g, '-')
            .replace(/[:^'()]/g, '_')
            .replace(/\."before-all"-hook-for-"[\w-#]+"/, '');
        if (!existsSync(basePath)) {
            mkdirSync(basePath);
        }

        const hash = createHash('md5').update(content).digest('hex').substring(0, 6);
        const path = `${basePath}/${fileName}-${hash}`;

        try {
            return JSON.parse(readFileSync(`${path}.json`, 'utf8')) as ReturnType<typeof compile>;
        } catch {
            if (!versionsLoaded.has(version)) {
                opts.context.timeout(opts.context.timeout() + 5000);
                if (opts.context.test) {
                    opts.context.test.title += `--loads \`solc-${version}\``;
                }
            }
            writeCacheFn = output => writeFileSync(`${path}.json`, JSON.stringify(output, null, 2));
        }
    } else {
        writeCacheFn = _output => {};
    }

    const input = {
        language: 'Solidity',
        sources: {
            SOURCE: {
                content,
            },
        },
        settings: {
            // optimizer: {
            //     enabled:true,
            //     details: {
            //         deduplicate: true,
            //         cse: true,
            //         constantOptimizer: true,
            //         yul: true,
            //     }
            // },
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.deployedBytecode'],
                },
            },
        },
    };

    versionsLoaded.add(version);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solc = setupMethods(require(path.resolve('.solc', `${version}.js`))) as {
        compile: (input: string) => string;
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input))) as SolcOutput;

    if (!valid(output)) {
        const errors = (output.errors || []).map(error => error.formattedMessage);
        throw new Error(errors.join('\n'));
    }

    const { contracts } = output;
    const contract = contracts['SOURCE'];

    let selectedContract;
    if (opts.contractName) {
        if (!(opts.contractName in contract)) {
            throw new Error(
                `Contract '${
                    opts.contractName
                }' is not a valid contract. Valid contracts are: ${Object.keys(contract).join(
                    ', '
                )}.`
            );
        } else {
            selectedContract = contract[opts.contractName];
        }
    } else {
        selectedContract = Object.values(contract)[0];
    }

    const bytecode = selectedContract.evm.deployedBytecode.object;
    const abi = selectedContract.abi;
    writeCacheFn({ bytecode, abi });

    return { bytecode, abi };

    function valid(output: SolcOutput): boolean {
        const sev = opts.severity ?? 'error';
        return (
            'contracts' in output &&
            (!('errors' in output) ||
                output.errors.filter(
                    err => SEVERITY[err.severity as keyof typeof SEVERITY] >= SEVERITY[sev]
                ).length === 0)
        );
    }

    function title(test: Runnable | Suite | undefined): string {
        return test ? title(test.parent) + '.' + test.title : '';
    }
}

export function forVersion(
    fn: (
        compile_: (content: string, context?: Mocha.Context) => ReturnType<typeof compile>,
        fallback: 'fallback' | 'function',
        version: Version
    ) => void
) {
    VERSIONS.forEach(version => {
        if (version.startsWith(process.env['SOLC'] ?? '')) {
            // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#semantic-and-syntactic-changes
            // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#how-to-update-your-code
            const fallback = version.startsWith('0.5') ? 'function' : 'fallback';

            describe(`solc-v${version}`, function () {
                fn(
                    (content, context) =>
                        compile(content, version, {
                            ...(context ? { context } : {}),
                        }),
                    fallback,
                    version
                );
            });
        }
    });
}

export function contracts(title: string, fn: Parameters<typeof forVersion>[0]) {
    describe(`contracts::${title}`, function () {
        forVersion(fn);
    });
}
