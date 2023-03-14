import { readFileSync } from 'fs';
import { type Opcode, toHex } from '../src/opcode';
import * as yargs from 'yargs';
import type { Argv } from 'yargs';
import chalk = require('chalk');
import { EVM } from '../test/utils/evm';

const blue = chalk.blue;
const dim = chalk.dim;
const magenta = chalk.magenta;

function getEVM(path: string) {
    const bytecode = readFileSync(path, 'utf8');
    return EVM(bytecode);
}

function ansiOpcode(opcode: Opcode) {
    const pc = opcode.pc.toString().padStart(6).toUpperCase();
    const offset = ('0x' + opcode.offset.toString(16)).padStart(8);
    const pushData = opcode.pushData
        ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${toHex(opcode.pushData)}`
        : '';
    return `${dim(pc)} ${blue(offset)}  ${magenta(opcode.mnemonic)}    ${pushData}`;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
const pathArg = (argv: Argv) =>
    argv.positional('path', {
        type: 'string',
        describe: 'path to the bytecode file',
    });

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
void yargs
    .scriptName('evmjs')
    .usage('$0 <cmd> [path]')
    .command(
        'dis [path]',
        'Disassemble the bytecode into Opcodes',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            console.info(
                `${dim('index'.padStart(6))} ${blue('pc'.padStart(8))}  ${magenta(
                    'mnemonic'
                )}  ${'push data (PUSHx)'}`
            );
            evm.start();
            // evm.opcodes.forEach(opcode => console.info(ansiOpcode(opcode)));

            const keys = [...evm.chunks.keys()];
            keys.sort((a, b) => a - b);
            for (const pc of keys) {
                const chunk = evm.chunks.get(pc)!;
                console.info(pc, ':');
                // console.log(pc, ':', block.entry.key);

                for (let i = pc; i < chunk.pcend; i++) {
                    const opcode = evm.opcodes[i];
                    console.info(ansiOpcode(opcode));
                }

                for (const state of chunk.states) {
                    console.info('    〒 ', state.stack.values.join(' | '));
                    state.stmts.forEach(stmt => console.info('  ', stmt.toString()));
                }
            }
        }
    )
    .option('selector', {
        alias: 's',
        type: 'string',
        description:
            'Function signature, e.g., `balanceOf(address)`, or hash selector to choose a specific function',
    })
    .demandCommand(1, 'At least one command must be specified')
    .help().argv;
