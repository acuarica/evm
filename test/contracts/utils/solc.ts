export const VERSIONS = ['0.5.5', '0.5.17', '0.8.16'] as const;

export type Version = typeof VERSIONS[number];

export const solcs = Object.fromEntries(
    VERSIONS.map(version => [
        version,
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(`solc-${version}`) as {
            version: () => string;
            compile: (input: string) => string;
        },
    ])
);

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
    contractName: string,
    content: string,
    version: Version = '0.5.5',
    license: 'MIT' = 'MIT'
): string {
    const input = {
        language: 'Solidity',
        sources: {
            SOURCE: {
                content:
                    `// SPDX-License-Identifier: ${license}\npragma solidity ${version};\n` +
                    content,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['evm.deployedBytecode'],
                },
            },
        },
    };

    const output = JSON.parse(solcs[version].compile(JSON.stringify(input))) as SolcOutput;

    if (!valid(output)) {
        const errors = (output.errors || []).map(error => error.formattedMessage);
        throw new Error(errors.join('\n'));
    }

    const { contracts } = output;
    const contract = contracts['SOURCE'];

    if (!(contractName in contract)) {
        throw new Error(
            `Contract '${contractName}' is not a valid contract. Valid contracts are: ${Object.keys(
                contract
            ).join(', ')}.`
        );
    }

    const bytecode = contract[contractName].evm.deployedBytecode.object;
    return bytecode;

    function valid(output: SolcOutput): boolean {
        return 'contracts' in output && (!('errors' in output) || output.errors.length === 0);
    }
}
