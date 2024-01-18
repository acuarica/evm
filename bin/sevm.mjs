#!/usr/bin/env node
/* eslint-env node */

import c from 'ansi-colors';
import assert from 'assert';
import envPaths from 'env-paths';
import { EtherscanProvider } from 'ethers';
import { existsSync, mkdirSync, promises, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import yargs from 'yargs';

import { Contract, sol, yul } from 'sevm';
import 'sevm/4bytedb';

const paths = envPaths('sevm');

const { underline, blue, dim, magenta, red, cyan: info, yellow: warn } = c;

/**
 * @typedef {import('sevm').State<import('sevm/ast').Inst, import('sevm/ast').Expr>} EVMState
 */

/** 
 * @param {Contract} contract 
 * @param {import('yargs').ArgumentsCamelCase} argv 
 */
function dis(contract, argv) {
    const MAX_STACK = 10;

    console.info(`${dim('pc'.padStart(5))}  ${magenta('opcode')}  ${'push data (PUSHx)'}`);

    for (const chunk of contract.chunks()) {
        console.info(c.blue(chunk.pcbegin.toString()), ':', chunk.states === undefined ? red('unreachable') : '');

        if (chunk.content instanceof Uint8Array) {
            console.info(Buffer.from(chunk.content).toString('hex'));
        } else {
            const block = contract.blocks.get(chunk.pcbegin);
            for (const { opcode, stack } of block?.opcodes ?? []) {
                const pc = opcode.pc.toString().padStart(5);
                const pushData = opcode.data
                    ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${opcode.hexData()}`
                    : '';

                let values;
                if (argv['with-stack']) {
                    values = info('〒 ');
                    values += stack === undefined
                        ? warn('<no stack>')
                        : stack.values.slice(0, MAX_STACK).map(e => yul`${e}`).join(dim('|')) +
                        (stack.values.length > MAX_STACK ? dim(`| ..${stack.values.length - MAX_STACK} more items`) : '');
                } else {
                    values = '';
                }
                console.info(`${dim(pc)}  ${magenta(opcode.mnemonic)}  ${pushData} ${values}`);
            }
        }

        if (argv['with-trace'] && chunk.states !== undefined) {
            for (const state of chunk.states) {
                console.info('state', '〒 ', state.stack.values.map(e => yul`${e}`).join(' | '));
                state.stmts.forEach(stmt => console.info('  ', yul`${stmt}`));
            }
        }
    }
}

/**
 * @param {string} pathOrAddress
 * @returns {Promise<string | null>}
 */
async function getBytecode(pathOrAddress) {
    const cacheFolder = path.join(paths.cache, 'mainnet');
    const cachePath = path.join(cacheFolder, `${pathOrAddress}.bytecode`);

    const readInputFile = async () => {
        if (pathOrAddress === '') {
            const buffer = readFileSync(process.stdin.fd, 'utf-8').trim();
            if (buffer !== '') return Promise.resolve(buffer);
            throw new Error('No input from stdin');
        }
        return await promises.readFile(pathOrAddress, 'utf8');
    };

    /** @param {unknown} field */
    const fromJSONField = field =>
        field !== null && typeof field === 'object' && 'object' in field && typeof field['object'] === 'string'
            ? field['object']
            : typeof field === 'string'
                ? field
                : null;

    const tries = [
        async () => {
            const text = await readInputFile();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                return text;
            }
            const { deployedBytecode, bytecode } = json;
            const value = fromJSONField(deployedBytecode) ?? fromJSONField(bytecode);
            if (value !== null)
                return value;
            throw new Error('Cannot find `deployedBytecode`|`bytecode` in json file');
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

/** @param {(contract: Contract, argv: import('yargs').ArgumentsCamelCase) => void} handler */
function make(handler) {
    /** @param {import('yargs').ArgumentsCamelCase} argv */
    return async argv => {
        const pathOrAddress = /** @type {string} */ (argv['contract']);
        const bytecode = await getBytecode(pathOrAddress);
        if (bytecode !== null) {
            const contract = new Contract(bytecode).patchdb();
            handler(contract, argv);
        } else {
            console.info(warn(`Cannot find bytecode for ${info(pathOrAddress)}`));
            process.exit(1);
        }
    };
}

/** @param {import('yargs').Argv} argv */
const pos = argv => argv.positional('contract', {
    type: 'string',
    describe: 'path or address where to locate the bytecode of the contract',
});

void yargs(process.argv.slice(2))
    .scriptName('sevm')
    .usage('$0 <cmd> <contract>')
    .command('metadata <contract>', 'Shows the Metadata of the contract[1]', pos, make(contract => {
        console.info(underline('Contract Metadata'));
        if (contract.metadata) {
            console.info(blue('protocol'), contract.metadata.protocol);
            console.info(blue('hash'), contract.metadata.hash);
            console.info(blue('solc'), contract.metadata.solc);
            console.info(blue('url'), contract.metadata.url);
        } else {
            console.info(warn('No metadata'));
        }
    }))
    .command('abi <contract>', 'Shows the ABI of the contract[2]', pos, make(contract => {
        console.info(underline('Function Selectors'));
        contract.getFunctions().forEach(sig => console.info(' ', blue(sig)));
        console.info();
        console.info(underline('Events'));
        contract.getEvents().forEach(sig => console.info(' ', magenta(sig)));
    }))
    .command('selectors <contract>', 'Shows the function selectors of the contract[3]', pos, make(contract => {
        for (const [selector, fn] of Object.entries(contract.functions)) {
            console.info(
                c.cyan('0x' + selector),
                fn.label === undefined ? warn('<no signature>') : fn.label
            );
        }
    }))
    .command('dis <contract>', 'Disassemble the bytecode into Opcodes', argv => pos(argv)
        .option('with-stack', {
            description: 'Include the current stack next to each decoded opcode',
        })
        .option('with-trace', {
            description: 'Include the trace of staments at the end of each basic block',
        }), make(dis))
    .command(
        'cfg <contract>',
        'Writes the cfg of the selected function in `dot` format into standard output',
        pos,
        make(cfg)
    )
    .command('sol <contract>', "Decompile the contract into Solidity-like source", pos, make(contract => {
        console.info(contract.solidify());
    }))
    .command('yul <contract>', "Decompile the contract into Yul-like source[4]", pos, make(contract => {
        console.info(contract.yul());
    }))
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
    // .option('selector', {
    //     alias: 's',
    //     type: 'string',
    //     description:
    //         'Function signature, e.g., `balanceOf(address)` or selector hash to choose a specific function',
    // })
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
[3] See https://docs.soliditylang.org/en/latest/abi-spec.html#function-selector for more information regarding Function Selectors
[4] See https://docs.soliditylang.org/en/latest/yul.html for more information regarding Yul.`
    )
    .strict()
    .help().argv;

/** @param {Contract} contract */
function cfg(contract) {
    /** @type {WeakMap<EVMState, string>} */
    const ids = new WeakMap();
    let id = 0;
    for (const block of contract.blocks.values()) {
        for (const state of block.states) {
            assert(!ids.has(state));

            if (!ids.has(state)) {
                ids.set(state, `id-${id}`);
                id++;
            }
        }
    }

    const write = console.log;
    write(`digraph G {    
    color="#efefef";
    #rankdir = LR;
    #graph[fontsize=6];

    node[shape=box style=filled fontsize=12 fontname="Verdana" fillcolor="#efefef"];
    `);

    let edges = '';
    for (const [pc, block] of contract.blocks) {
        write(`subgraph cluster_${pc} {`);
        write(`  style=filled;`);
        let label = `pc ${pc}\\l`;

        // for (let i = pc; i < chunk.pcend; i++) {
        //     const opcode = evm.opcodes[i];
        //     label += opcode.formatOpcode() + '\\l';
        // }
        write(`  label = "${label}";`);

        for (const state of block.states) {
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
    write('}');

    /**
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
     * @param {EVMState} src
     * @param {import('sevm/ast').Branch} branch
     */
    function writeEdge(src, branch) {
        const id = ids.get(src);
        edges += `"${id}" -> "${ids.get(branch.state)}";\n`;
    }
}
