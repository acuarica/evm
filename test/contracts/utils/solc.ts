export const VERSIONS = ['0.5.5', '0.5.17', '0.8.16'] as const;

export type Version = typeof VERSIONS[number];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const solcs = Object.fromEntries(
    VERSIONS.map(version => [
        version,
        require(`solc-${version}`) as { compile: (input: string) => string },
    ])
);

export function compile(contractName: string, content: string, version: Version = '0.5.5'): string {
    const source = 'SOURCE' as const;
    const solc = solcs[version];

    const input = {
        language: 'Solidity',
        sources: {
            [source]: {
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
    const output = JSON.parse(solc.compile(JSON.stringify(input))) as {
        contracts: {
            [source]: {
                [contractName: string]: { evm: { bytecode: Bytecode; deployedBytecode: Bytecode } };
            };
        };
        sources: { [source]: { id: 0 } }; // Not currently used
        errors: [{ formattedMessage: string }];
    };

    console.log(output);

    if (!valid(output)) {
        const errors = (output.errors || []).map(error => error.formattedMessage);
        throw new Error(errors.join('\n'));
    }

    const { contracts } = output;
    const contract = contracts[source];
    // console.log(contract[contractName]);
    // const name1 = Object.keys(contract)[0];

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
