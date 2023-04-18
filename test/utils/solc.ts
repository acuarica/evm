import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import type { Runnable, Suite } from 'mocha';
import * as semver from 'semver';

export const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16'] as const;

type Version = (typeof VERSIONS)[number];

type Bytecode = {
    object: string;
    opcodes: string;
    sourceMap: string;
};

type SolcOutput = {
    contracts: {
        SOURCE: {
            [contractName: string]: { evm: { bytecode: Bytecode; deployedBytecode: Bytecode } };
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
): { bytecode: string } {
    content = `// SPDX-License-Identifier: MIT\npragma solidity ${version};\n${content}`;

    let writeCacheFn: (output: ReturnType<typeof compile>) => void;
    if (opts.context !== undefined) {
        const basePath = './.bytecode';
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
            const bytecode = readFileSync(`${path}.bytecode`, 'utf8');
            return { bytecode };
        } catch {
            if (!versionsLoaded.has(version)) {
                opts.context.timeout(opts.context.timeout() + 2000);
                if (opts.context.test) {
                    opts.context.test.title += `--loads \`solc-${version}\``;
                }
            }
            writeCacheFn = ({ bytecode }) => {
                writeFileSync(`${path}.bytecode`, bytecode);
            };
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
                    '*': ['evm.deployedBytecode'],
                },
            },
        },
    };

    versionsLoaded.add(version);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solc = require(`solc-${version}`) as {
        // Not used
        version: () => string;
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
    writeCacheFn({ bytecode });

    return { bytecode };

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
            const fallback = semver.gte(version, '0.6.0') ? 'fallback' : 'function';

            describe(`solc-v${version}`, () => {
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
    describe(`contracts::${title}`, () => {
        forVersion(fn);
    });
}
