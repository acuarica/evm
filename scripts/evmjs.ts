import { readFileSync } from 'fs';
import { type Opcode, toHex, formatOpcode } from '../src/opcode';
import * as yargs from 'yargs';
import type { Argv } from 'yargs';
import chalk = require('chalk');
import { EVM } from '../src/evm';
import { eventSelectors, getFunctionSignature } from '../test/utils/selector';
import type { Expr, Stmt } from '../src/evm/expr';
import type { State } from '../src/state';
import type { Branch } from '../src/evm/flow';
import { inspect } from 'util';

const blue = chalk.blue;
const dim = chalk.dim;
const magenta = chalk.magenta;

function getEVM(path: string) {
    const bytecode = readFileSync(path, 'utf8');
    return EVM.from(bytecode);
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
    .scriptName('evm')
    .usage('$0 <cmd> [path]')

    .command(
        'abi [path]',
        'Shows the ABI of the contract',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const evm = getEVM(argv['path'] as string);
            evm.start();
            eventSelectors(evm);

            console.info('Function Selectors');
            [...evm.functionBranches.keys()].forEach(s =>
                console.info(dim(s), getFunctionSignature(s))
            );

            console.info('Events');
            [...Object.entries(evm.events)].forEach(([s, b]) => console.info(dim(s), b.sig));
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
            evm.start();

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
                    console.info('state');
                    console.info('    〒 ', state.stack.values.join(' | '));
                    state.stmts.forEach(stmt => console.info('  ', stmt.toString()));
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
            evm.start();
            writeDot(evm);
        }
    )

    .option('selector', {
        alias: 's',
        type: 'string',
        description:
            'Function signature, e.g., `balanceOf(address)` or selector hash to choose a specific function',
    })

    .demandCommand(1, 'At least one command must be specified')
    .help().argv;

function writeDot(evm: EVM) {
    const write = console.log;
    write(`digraph G {    
    color="#efefef";
    node[shape=box style=filled fontsize=8 fontname="Verdana" fillcolor="#efefef"];
    `);

    let id = 0;
    for (const [, chunk] of evm.chunks) {
        for (const state of chunk.states) {
            if (state.id === undefined) {
                state.id = `id-${id}`;
                id++;
            }
        }
    }

    dot(evm);
    write('}');

    function dot(evm: EVM) {
        let edges = '';
        for (const [pc, chunk] of evm.chunks) {
            write(`subgraph cluster_${pc} {`);
            // write(`  style=filled;`);
            // write(`  node [style=filled,color=white];`);
            let label = `pc ${pc}\\l`;

            for (let i = pc; i < chunk.pcend; i++) {
                const opcode = evm.opcodes[i];
                label += formatOpcode(opcode) + '\\l';
            }
            write(`  label = "${label}";`);

            for (const state of chunk.states) {
                writeNode(pc, state);
                switch (state.last?.name) {
                    case 'Jumpi':
                        writeEdge(state.id, state.last.destBranch);
                        writeEdge(state.id, state.last.fallBranch);
                        break;
                    case 'SigCase':
                        // writeEdge(pc, state.last.condition.hash);
                        writeEdge(state.id, state.last.fallBranch);
                        break;
                    case 'Jump':
                        writeEdge(state.id, state.last.destBranch);
                        break;
                    case 'JumpDest':
                        writeEdge(state.id, state.last.fallBranch);
                        break;
                }
            }
            write('}\n');
        }
        write(edges);

        function writeNode(pc: number, state: State<Stmt, Expr>) {
            let label = `key:${pc} ${state.id}`;
            label += '\\l';
            // label += 'doms: ' + [...doms].join(', ');
            // label += '\\l';
            // if (tree) {
            //     label += 'tree: ' + [...tree].join(', ');
            //     label += '\\l';
            // }
            // label += block.entry.state.stack.values.map(elem => `=| ${elem.toString()}`).join('');
            // label += '\\l';
            // label += block.opcodes.map(op => formatOpcode(op)).join('\\l');
            // label += '\\l';
            label += state.stack.values.map(elem => `=| ${elem.toString()}`).join('');
            label += '\\l';
            label += inspect(state.memory);
            label += '\\l';
            label += state.stmts.map(stmt => stmt.toString()).join('\\l');
            label += '\\l';

            write(
                `"${state.id}" [label="${label}" fillcolor="${
                    pc === '137:j86' ? '#ffa500' : '#efefef'
                }"];`
            );
        }

        function writeEdge(src: string, branch: Branch) {
            // write(`"${src}" -> "${branch.state.id}";`);
            edges += `"${src}" -> "${branch.state.id}";\n`;
        }
    }
}

// function sel() {

//             let cfg;
//             const selector = argv['selector'] as string;
//             if (selector) {
//                 const fn = evm.contract.getFunction(selector);
//                 if (!fn) {
//                     throw new Error('function ' + selector + ' not found');
//                 }
//                 cfg = fn.cfg;
//             } else {
//                 cfg = evm.contract.main.cfg;
//             }
// }
