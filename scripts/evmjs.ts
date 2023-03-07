/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { readFileSync } from 'fs';
import { Block, ControlFlowGraph } from '../src/cfg';
import { formatOpcode } from '../src/opcode';
import EVM from '../test/utils/evmtest';
import * as yargs from 'yargs';
import { Argv } from 'yargs';

const write = console.log;

function getEVM(path: string) {
    const bytecode = readFileSync(path, 'utf8');
    return new EVM(bytecode);
}

function writeDot(cfg: ControlFlowGraph) {
    write(`digraph G {    
    color="#efefef";
    node[shape=box style=filled fontsize=8 fontname="Verdana" fillcolor="#efefef"];
    `);

    dot(cfg);
    write('}');

    function dot({ blocks, doms }: ControlFlowGraph) {
        for (const [pc, block] of Object.entries(blocks)) {
            writeNode(pc, block, doms[pc]);

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

        function writeNode(pc: string, block: Block, doms: Set<string>) {
            let label = 'key:' + pc;
            label += '\\l';
            // label += 'doms: ' + [...doms].join(', ');
            label += '\\l';
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
        'dis [path]',
        'Disassemble the bytecode into Opcodes',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            evm.opcodes.forEach(op => console.error(formatOpcode(op)));
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
