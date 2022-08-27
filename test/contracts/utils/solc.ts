export const VERSIONS = ['0.5.5', '0.5.17', '0.8.16'] as const;

export type Version = typeof VERSIONS[number];

const solcs = Object.fromEntries(
    VERSIONS.map(version => [
        version,
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(`solc-${version}`) as { compile: (input: string) => string },
    ])
);

/**
 *
 * https://docs.soliditylang.org/en/v0.8.16/using-the-compiler.html#compiler-input-and-output-json-description
 *
 * @param contractName
 * @param content
 * @param version
 * @returns
 */
export function solc(
    contractName: string,
    content: string,
    version: Version = '0.5.5',
    license: 'MIT' = 'MIT'
): string {
    const source = 'SOURCE' as const;

    const input = {
        language: 'Solidity',
        sources: {
            [source]: {
                content:
                    `// SPDX-License-Identifier: ${license}\npragma solidity ${version};\n` +
                    content,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    type Bytecode = {
        object: string;
        opcodes: string;
        sourceMap: string;
    };
    const output = JSON.parse(solcs[version].compile(JSON.stringify(input))) as {
        contracts: {
            [source]: {
                [contractName: string]: { evm: { bytecode: Bytecode; deployedBytecode: Bytecode } };
            };
        };
        sources: { [source]: { id: 0 } }; // Not currently used
        errors: [{ formattedMessage: string }];
    };

    if (!valid(output)) {
        const errors = (output.errors || []).map(error => error.formattedMessage);
        throw new Error(errors.join('\n'));
    }

    const { contracts } = output;
    const contract = contracts[source];

    if (!(contractName in contract)) {
        throw new Error(
            `Contract '${contractName}' is not a valid contract. Valid contracts are: ${Object.keys(
                contract
            ).join(', ')}.`
        );
    }

    const bytecode = contract[contractName].evm.deployedBytecode.object;
    return bytecode;

    function valid(output: any): boolean {
        return 'contracts' in output && (!('errors' in output) || output.errors.length === 0);
    }
}
