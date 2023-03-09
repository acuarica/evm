/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { readFileSync } from 'fs';
import type { Block, ControlFlowGraph } from '../src/cfg';
import { formatOpcode, type Opcode, toHex } from '../src/opcode';
import EVM from '../test/utils/evmtest';
import * as yargs from 'yargs';
import type { Argv } from 'yargs';
import chalk = require('chalk');

const write = console.log;

const blue = chalk.blue;
const dim = chalk.dim;
const magenta = chalk.magenta;

function getEVM(path: string) {
    const bytecode = readFileSync(path, 'utf8');
    return new EVM(bytecode);
}

function ansiOpcode(opcode: Opcode) {
    const pc = opcode.pc.toString().padStart(6).toUpperCase();
    const offset = ('0x' + opcode.offset.toString(16)).padStart(8);
    const pushData = opcode.pushData
        ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${toHex(opcode.pushData)}`
        : '';
    return `${dim(pc)} ${blue(offset)}  ${magenta(opcode.mnemonic)}    ${pushData}`;
}

function writeDot(cfg: ControlFlowGraph) {
    write(`digraph G {    
    color="#efefef";
    node[shape=box style=filled fontsize=8 fontname="Verdana" fillcolor="#efefef"];
    `);

    dot(cfg);
    write('}');

    function dot({ blocks, doms, treed }: ControlFlowGraph) {
        for (const [pc, block] of Object.entries(blocks)) {
            writeNode(pc, block, doms[pc], treed[pc]);

            switch (block.last.name) {
                case 'Jumpi':
                    writeEdge(pc, block.last.destBranch.key);
                    writeEdge(pc, block.last.fallBranch.key);
                    break;
                case 'SigCase':
                    writeEdge(pc, block.last.condition.hash);
                    writeEdge(pc, block.last.fallBranch.key);
                    break;
                case 'Jump':
                    writeEdge(pc, block.last.destBranch.key);
                    break;
                case 'JumpDest':
                    writeEdge(pc, block.last.fallBranch.key);
                    break;
            }
            // const last = block.stmts.at(-1);
            // if (last instanceof Jumpi) {
            //     writeEdge(pc, last.destBranch.key);
            //     writeEdge(pc, last.fallBranch.key);
            // } else if (last instanceof Jump) {
            //     writeEdge(pc, last.destBranch.key);
            // } else if (last instanceof JumpDest) {
            //     writeEdge(pc, last.fallBranch.key);
            // }
        }

        function writeNode(pc: string, block: Block, doms: Set<string>, tree: Set<string>) {
            let label = 'key:' + pc;
            label += '\\l';
            label += 'doms: ' + [...doms].join(', ');
            label += '\\l';
            if (tree) {
                label += 'tree: ' + [...tree].join(', ');
                label += '\\l';
            }
            label += block.entry.state.stack.values.map(elem => `=| ${elem.toString()}`).join('');
            label += '\\l';
            label += block.opcodes.map(op => formatOpcode(op)).join('\\l');
            label += '\\l';
            label += block.stack.values.map(elem => `=| ${elem.toString()}`).join('');
            label += '\\l';
            label += block.stmts.map(stmt => stmt.toString()).join('\\l');

            write(
                `"${pc}" [label="${label}" fillcolor="${
                    pc === '137:j86' ? '#ffa500' : '#efefef'
                }"];`
            );
        }

        function writeEdge(src: string, key: string) {
            write(`"${src}" -> "${key}";`);
        }
    }
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
        'abi [path]',
        'Writes the abi of the selected function in `dot` format into standard output',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            console.info(evm.getFunctions());
            Object.values(evm.contract.functions).forEach(f => console.info(f.label, f.hash));
            // console.info(evm.contract.main.cfg.functionBranches);
        }
    )
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
            evm.opcodes.forEach(opcode => console.info(ansiOpcode(opcode)));
        }
    )
    .command(
        'pp [path]',
        'Pretty the bytecode into Opcodes',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);

            const cfg = (() => {
                const selector = argv['selector'] as string;
                if (selector) {
                    const fn = evm.contract.getFunction(selector);
                    if (!fn) {
                        throw new Error('function ' + selector + ' not found');
                    }
                    return fn.cfg;
                } else {
                    return evm.contract.main.cfg;
                }
            })();

            pprint(cfg);
            function pprint({ blocks }: ControlFlowGraph) {
                for (const [pc, block] of Object.entries(blocks)) {
                    console.log(pc, ':', block.entry.key);
                    block.opcodes.forEach(op => console.info(ansiOpcode(op)));
                    console.log('  〒 ', block.stack.values.join(' | '));
                    block.stmts.forEach(stmt => console.info('  ', stmt.toString()));
                }
            }
        }
    )
    .command(
        'cfg [path]',
        'Writes the cfg of the selected function in `dot` format into standard output',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            let cfg;
            const selector = argv['selector'] as string;
            if (selector) {
                const fn = evm.contract.getFunction(selector);
                if (!fn) {
                    throw new Error('function ' + selector + ' not found');
                }
                cfg = fn.cfg;
            } else {
                cfg = evm.contract.main.cfg;
            }
            writeDot(cfg);
        }
    )
    .command(
        'decompile [path]',
        'Decompile the bytecode into Solidity pseudo-source code',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            console.info(evm.decompile());
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
