#!/usr/bin/env node
/* eslint-env node */

import { existsSync, mkdirSync, promises, writeFileSync } from 'fs';
import yargs from 'yargs';
import c from 'ansi-colors';
import assert from 'assert';
import { EtherscanProvider } from 'ethers';
import envPaths from 'env-paths';
import path from 'path';

import { Contract, sol } from 'sevm';
import 'sevm/4byte';

const paths = envPaths('sevm');

const underline = c.underline;
const blue = c.blue;
const dim = c.dim;
const magenta = c.magenta;
// const red = c.red;
const info = c.cyan;
const warn = c.yellow;

/**
 * @typedef {import('sevm').State<import('sevm/ast').Inst, import('sevm/ast').Expr>} EVMState
 */

/** @param {import('sevm').Opcode<string>} opcode */
export function ansiOpcode(opcode) {
    const pc = opcode.pc.toString().padStart(6).toUpperCase();
    const offset = '?';//`0x${opcode.offset.toString(16)}`.padStart(8);
    const pushData = opcode.data
        ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${opcode.hexData()}`
        : '';
    return `${dim(pc)} ${blue(offset)}  ${magenta(opcode.mnemonic)}    ${pushData}`;
}

/**
 * @param {Contract} contract
 */
function metadata(contract) {
    console.info(underline('Contract Metadata'));
    if (contract.metadata) {
        console.info(blue('protocol'), contract.metadata.protocol);
        console.info(blue('hash'), contract.metadata.hash);
        console.info(blue('solc'), contract.metadata.solc);
        console.info(blue('url'), contract.metadata.url);
    } else {
        console.info(warn('No metadata'));
    }
}

/** @param {Contract} contract */
function abi(contract) {
    console.info(underline('Function Selectors'));
    contract.getFunctions().forEach(sig => console.info(' ', blue(sig)));

    console.info();
    console.info(underline('Events'));
    contract.getEvents().forEach(sig => console.info(' ', magenta(sig)));
}

/** @param {Contract} _contract */
function dis(_contract) {
    console.info(
        `${dim('index'.padStart(6))} ${blue('pc'.padStart(8))}  ${magenta(
            'mnemonic'
        )}  ${'push data (PUSHx)'}`
    );

    // for (const chunk of contract.chunks()) {
        // console.info(chunk.pcstart, ':', chunk.states === undefined ? red('unreachable') : '');

        // for (let i = chunk.pcstart; i < chunk.pcend; i++) {
        //     const opcode = contract.evm.opcodes[i];
        //     console.info(ansiOpcode(opcode));
        // }

        // if (chunk.states !== undefined) {
        //     for (const state of chunk.states) {
        //         console.info('state');
        //         console.info('    〒 ', state.stack.values.join(' | '));
        //         state.stmts.forEach(stmt => console.info('  ', sol`${stmt}`));
        //     }
        // }
    // }
}

/** @param {Contract} contract */
function decompile(contract) {
    console.info(contract.solidify());
}

/**
 *
 * @param {string} pathOrAddress
 * @returns {Promise<string | null>}
 */
async function getBytecode(pathOrAddress) {
    const cacheFolder = path.join(paths.cache, 'mainnet');
    const cachePath = path.join(cacheFolder, `${pathOrAddress}.bytecode`);

    const tries = [
        async () => {
            const text = await promises.readFile(pathOrAddress, 'utf8');
            if (pathOrAddress.endsWith('.json')) {
                const { deployedBytecode, bytecode } = JSON.parse(text);
                if (deployedBytecode !== undefined) {
                    return deployedBytecode['object'] ?? deployedBytecode;
                }
                if (bytecode !== undefined) {
                    return bytecode['object'] ?? bytecode;
                }
                throw new Error('Cannot find `deployedBytecode` in json file');
            }
            return text;
        },
        () => promises.readFile(cachePath, 'utf8'),
        async () => {
            const provider = new EtherscanProvider();
            const bytecode = await provider.getCode(pathOrAddress);
            if (!existsSync(cacheFolder)) {
                mkdirSync(cacheFolder, { recursive: true });
            }
            writeFileSync(cachePath, bytecode, 'utf8');
            return bytecode;
        },
    ];

    for (const fn of tries) {
        try {
            return await fn();
        } catch (_err) {
            // console.log(_err);
        }
    }
    return null;
}

/** @param {(contract: Contract) => void} handler */
function make(handler) {
    /** @param {import('yargs').ArgumentsCamelCase} argv */
    return async argv => {
        const pathOrAddress = /** @type {string} */ (argv['contract']);
        const bytecode = await getBytecode(pathOrAddress);
        if (bytecode !== null) {
            const contract = new Contract(bytecode).patch();
            handler(contract);
        } else {
            console.info(warn(`Cannot find bytecode for ${info(pathOrAddress)}`));
            process.exit(1);
        }
    };
}

/** @param {import('yargs').Argv} argv */
const pos = argv =>
    argv.positional('contract', {
        type: 'string',
        describe: 'path or address where to locate the bytecode of the contract',
    });

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
void yargs(process.argv.slice(2))
    .scriptName('sevm')
    .usage('$0 <cmd> <contract>')
    .command('metadata <contract>', 'Shows the Metadata of the contract[1]', pos, make(metadata))
    .command('abi <contract>', 'Shows the ABI of the contract[2]', pos, make(abi))
    .command('dis <contract>', 'Disassemble the bytecode into Opcodes', pos, make(dis))
    .command(
        'cfg <contract>',
        'Writes the cfg of the selected function in `dot` format into standard output',
        pos,
        make(cfg)
    )
    .command(
        'sol <contract>',
        "Decompile the contract's bytecode into Solidity-like source code",
        pos,
        make(decompile)
    )
    .command(
        'yul <contract>',
        "Decompile the contract's bytecode into Yul-like source code[3]",
        pos,
        make(decompile)
    )
    .command('config', 'Shows cache path used to store downloaded bytecode', {}, () =>
        console.info(paths.cache)
    )
    .middleware(argv => {
        if (!argv['color']) {
            c.enabled = false;
        }
    })
    .option('color', {
        type: 'boolean',
        description: 'Display with colors, use `--no-color` to deactivate colors',
        default: true,
    })
    .option('selector', {
        alias: 's',
        type: 'string',
        description:
            'Function signature, e.g., `balanceOf(address)` or selector hash to choose a specific function',
    })
    .demandCommand(1, 'At least one command must be specified')
    .recommendCommands()
    .example(
        '$0 abi 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        'shows the ABI of the ENS registry contract'
    )
    .example(
        '$0 decompile 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        'decompiles the ENS registry contract'
    )
    .epilog(
        `[1] See https://docs.soliditylang.org/en/latest/metadata.html for more information regarding Metadata generated by the Solidity compiler.
[2] See https://docs.soliditylang.org/en/latest/abi-spec.html#abi-json for more information regarding the ABI specification.
[3] See https://docs.soliditylang.org/en/latest/yul.html for more information regarding Yul.`
    )
    .help().argv;

/**
 * @param {Contract} contract
 */
function cfg(contract) {
    //@ts-ignore
    const evm = contract.evm;
    const write = console.log;
    write(`digraph G {    
    color="#efefef";
    #rankdir = LR;
    #graph[fontsize=6];

    node[shape=box style=filled fontsize=12 fontname="Verdana" fillcolor="#efefef"];
    `);

    /** @type {WeakMap<EVMState, string>} */
    const ids = new WeakMap();
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

    /**
     * @parama {import('sevm').EVM<unknown>} evm
     * @param {any} evm
     */
    function dot(evm) {
        let edges = '';
        for (const [pc, chunk] of evm.blocks) {
            write(`subgraph cluster_${pc} {`);
            write(`  style=filled;`);
            // write(`  node [style=filled,color=white];`);
            let label = `pc ${pc}\\l`;

            for (let i = pc; i < chunk.pcend; i++) {
                const opcode = evm.opcodes[i];
                label += opcode.formatOpcode() + '\\l';
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

        /**
         *
         * @param {number} pc
         * @param {EVMState} state
         */
        function writeNode(pc, state) {
            const id = ids.get(state);
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
            label += state.stack.values.map(elem => sol`=| ${elem.eval()}`).join('');
            label += '\\l';
            // label += inspect(state.memory);
            // label += '\\l';
            Object.entries(state.memory).forEach(([k, v]) => (label += sol`${k}: ${v}\\l`));
            label += state.stmts.map(stmt => sol`${stmt}`).join('\\l');
            label += '\\l';

            write(`"${id}" [label="${label}" fillcolor="${'#ffa500'}"];`);
        }

        /**
         *
         * @param {EVMState} src
         * @param {import('sevm/ast').Branch} branch
         */
        function writeEdge(src, branch) {
            // write(`"${src}" -> "${branch.state.id}";`);
            const id = ids.get(src);
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

// const entries = [
//     /** @type {const} */ (['main', { decompile: () => solStmts(contract.main) }]),
//     ...Object.entries(contract.functions).map(
//         ([selector, fn]) => /**@type{const}*/ ([fn.label ?? selector, fn])
//     ),
// ];
// const fns = Object.fromEntries(entries);
// functionList.setItems(Object.keys(fns));

// eventList.setItems(contract.getEvents());
