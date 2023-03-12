import { existsSync, mkdirSync, writeFileSync } from 'fs';
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
    errors: { formattedMessage: string }[];
};

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
        contractName?: string;
        context?: Mocha.Context | undefined;
    } = {}
): { bytecode: string; deployedBytecode: string } {
    const input = {
        language: 'Solidity',
        sources: {
            SOURCE: {
                content: `// SPDX-License-Identifier: MIT\npragma solidity ${version};\n` + content,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['evm.bytecode', 'evm.deployedBytecode'],
                },
            },
        },
    };

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

    const deployedBytecode = selectedContract.evm.deployedBytecode.object;

    if (opts.context) {
        const basePath = './.contracts';
        const fileName = title(opts.context.test)
            .replace('..contracts.', '')
            .replace('solc-', '')
            .replace(/`/g, '')
            .replace(/[:^' ]/g, '-')
            .replace(/\."before-all"-hook-for-"[\w-]+"/, '');
        if (!existsSync(basePath)) {
            mkdirSync(basePath);
        }

        writeFileSync(`${basePath}/${fileName}.bytecode`, deployedBytecode);
    }

    const bytecode = selectedContract.evm.bytecode.object;
    return { bytecode, deployedBytecode };

    function valid(output: SolcOutput): boolean {
        return 'contracts' in output && (!('errors' in output) || output.errors.length === 0);
    }

    function title(test: Runnable | Suite | undefined): string {
        return test ? title(test.parent) + '.' + test.title : '';
    }
}

export function contract(
    title: string,
    fn: (
        compile_: (content: string, context?: Mocha.Context) => ReturnType<typeof compile>,
        fallback: 'fallback' | 'function',
        version: Version
    ) => void
) {
    describe(`contracts.${title}`, () => {
        VERSIONS.forEach(version => {
            if (version.startsWith(process.env['SOLC'] ?? '')) {
                const fallback = semver.gte(version, '0.6.0') ? 'fallback' : 'function';

                describe(`solc-v${version}`, () => {
                    fn(
                        (content, context) =>
                            compile(content, version, {
                                context: context,
                            }),
                        fallback,
                        version
                    );
                });
            }
        });
    });
}
