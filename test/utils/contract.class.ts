import * as fs from 'fs';
// import * as solc from 'solc';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const solc = require('solc');

export default class Contract {
    private output: any;

    loadFile(filename: string) {
        const source = fs.readFileSync('./test/contracts/' + filename, 'utf8');
        const input = {
            language: 'Solidity',
            sources: {
                [filename]: {
                    content: source,
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
        this.output = JSON.parse(solc.compile(JSON.stringify(input)));
    }

    load(name: string, content: string) {
        const input = {
            language: 'Solidity',
            sources: {
                [name]: {
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
        this.output = JSON.parse(solc.compile(JSON.stringify(input)));
    }

    valid() {
        return (
            'contracts' in this.output &&
            (!('errors' in this.output) || this.output.errors.length === 0)
        );
    }

    errors() {
        return (this.output.errors || []).map((error: any) => error.formattedMessage);
    }

    bytecode() {
        if (this.valid()) {
            const { contracts } = this.output;
            const filename = Object.keys(contracts)[0];
            const contract = contracts[filename];
            const name = Object.keys(contract)[0];
            const bytecode = contract[name].evm.deployedBytecode.object;
            return bytecode;
        } else {
            return '0x';
        }
    }
}
