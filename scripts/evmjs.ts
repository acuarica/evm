import { readFileSync } from 'fs';
import { type Opcode, toHex, formatOpcode } from '../src/opcode';
import * as yargs from 'yargs';
import type { Argv } from 'yargs';
import chalk = require('chalk');
import type { EVM } from '../src/evm';
import '../test/utils/selector';
import type { Expr, Inst } from '../src/evm/expr';
import type { State } from '../src/state';
import type { Branch } from '../src/evm/flow';
import { Contract } from '../src';
import { assert } from 'console';

const underline = chalk.underline;
const blue = chalk.blue;
const dim = chalk.dim;
const magenta = chalk.magenta;
const red = chalk.red;

function getContract(path: string) {
    const bytecode = readFileSync(path, 'utf8');
    return new Contract(bytecode).patch();
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
            const contract = getContract(argv['path'] as string);

            console.info(underline('Function Selectors'));
            contract.getFunctions().forEach(sig => console.info(' ', blue(sig)));

            console.info();
            console.info(underline('Events'));
            contract.getEvents().forEach(sig => console.info(' ', magenta(sig)));
        }
    )

    .command(
        'dis [path]',
        'Disassemble the bytecode into Opcodes',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            console.info(
                `${dim('index'.padStart(6))} ${blue('pc'.padStart(8))}  ${magenta(
                    'mnemonic'
                )}  ${'push data (PUSHx)'}`
            );
            const contract = getContract(argv['path'] as string);

            for (const chunk of contract.chunks()) {
                console.info(
                    chunk.pcstart,
                    ':',
                    chunk.states === undefined ? red('unreachable') : ''
                );

                for (let i = chunk.pcstart; i < chunk.pcend; i++) {
                    const opcode = contract.evm.opcodes[i];
                    console.info(ansiOpcode(opcode));
                }

                if (chunk.states !== undefined) {
                    for (const state of chunk.states) {
                        console.info('state');
                        console.info('    〒 ', state.stack.values.join(' | '));
                        state.stmts.forEach(stmt => console.info('  ', stmt.toString()));
                    }
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
            const contract = getContract(argv['path'] as string);
            writeDot(contract.evm);
        }
    )

    .command(
        'decompile [path]',
        'Decompile',
        (yargs: Argv) => {
            pathArg(yargs);
        },
        function (argv) {
            const contract = getContract(argv['path'] as string);
            console.info(contract.decompile());
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
    #rankdir = LR;
    #graph[fontsize=6];

    node[shape=box style=filled fontsize=12 fontname="Verdana" fillcolor="#efefef"];
    `);

    const ids = new WeakMap<State<Inst, Expr>, string>();
    let id = 0;
    for (const [, chunk] of evm.chunks) {
        for (const state of chunk.states) {
            assert(!ids.has(state));

            if (!ids.has(state)) {
                // state.id = `id-${id}`;
                ids.set(state, `id-${id}`);
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
            write(`  style=filled;`);
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
                        writeEdge(state, state.last.destBranch);
                        writeEdge(state, state.last.fallBranch);
                        break;
                    case 'SigCase':
                        // writeEdge(pc, state.last.condition.hash);
                        writeEdge(state, state.last.fallBranch);
                        break;
                    case 'Jump':
                        writeEdge(state, state.last.destBranch);
                        break;
                    case 'JumpDest':
                        writeEdge(state, state.last.fallBranch);
                        break;
                    default:
                }
            }
            write('}\n');
        }
        write(edges);

        function writeNode(pc: number, state: State<Inst, Expr>) {
            const id = ids.get(state)!;
            let label = `key:${pc} ${id}`;
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
            label += state.stack.values.map(elem => `=| ${elem.eval().toString()}`).join('');
            label += '\\l';
            // label += inspect(state.memory);
            // label += '\\l';
            Object.entries(state.memory).forEach(([k, v]) => (label += `${k}: ${v}\\l`));
            label += state.stmts.map(stmt => stmt.toString()).join('\\l');
            label += '\\l';

            write(`"${id}" [label="${label}" fillcolor="${'#ffa500'}"];`);
        }

        function writeEdge(src: State<Inst, Expr>, branch: Branch) {
            // write(`"${src}" -> "${branch.state.id}";`);
            const id = ids.get(src)!;
            edges += `"${id}" -> "${ids.get(branch.state)}";\n`;
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
