#!/usr/bin/env node
/* eslint-env node */

import c from 'ansi-colors';
import assert from 'assert';
import envPaths from 'env-paths';
import { existsSync, mkdirSync, promises, readFileSync, writeFileSync } from 'fs';
import js_sha3 from 'js-sha3';
import path from 'path';
import { debuglog } from 'util';
import yargs from 'yargs';

import { Contract, sol, yul } from 'sevm';
import 'sevm/4byte';

import { isValidAddress } from './.address.mjs';
import { Provider } from './.provider.mjs';

const paths = envPaths('sevm');

const { cyan: info, yellow: warn } = c;

const trace = debuglog('sevm');

/** 
 * @param {Contract} contract 
 * @param {import('yargs').ArgumentsCamelCase} argv 
 */
function dis(contract, argv) {
    const MAX_STACK = 10;

    console.info(`${c.dim('pc'.padStart(5))}  ${c.magenta('opcode')}  ${'push data (PUSHx)'}`);

    for (const chunk of contract.chunks()) {
        console.info(c.blue(chunk.pcbegin.toString()), ':', chunk.states === undefined ? c.red('unreachable') : '');

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
                        : stack.values.slice(0, MAX_STACK).map(e => yul`${e}`).join(c.dim('|')) +
                        (stack.values.length > MAX_STACK ? c.dim(`| ..${stack.values.length - MAX_STACK} more items`) : '');
                } else {
                    values = '';
                }
                console.info(`${c.dim(pc)}  ${c.magenta(opcode.mnemonic)}  ${pushData} ${values}`);
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
 * @param {boolean} cache
 * @param {string} rpcUrl
 * @returns {Promise<string | null>}
 */
async function getBytecode(pathOrAddress, cache, rpcUrl) {
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
            /** @type {Record<string, unknown>} */
            let json;
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                json = JSON.parse(text);
            } catch {
                return text;
            }
            const { deployedBytecode, bytecode } = json;
            const value = fromJSONField(deployedBytecode) ?? fromJSONField(bytecode);
            if (value !== null)
                return value;
            throw new Error('Cannot find `deployedBytecode`|`bytecode` in json file');
        },
        async () => {
            const cacheFolder = path.join(paths.cache, 'mainnet');
            const cachePath = path.join(cacheFolder, `${pathOrAddress}.bytecode`);

            try {
                if (!cache) throw new Error(`Cache to fetch contract bytecode disabled`);
                return await promises.readFile(cachePath, 'utf8');
            } catch (err) {
                trace('%s', err instanceof Error ? err.message : err);
                const provider = new Provider(rpcUrl);
                if (!isValidAddress(pathOrAddress)) throw new Error('Invalid address, bad address checksum');
                const bytecode = await provider.getCode(pathOrAddress);
                trace('Contract bytecode fetched from remote network');

                if (cache) {
                    if (!existsSync(cacheFolder)) {
                        mkdirSync(cacheFolder, { recursive: true });
                    }
                    writeFileSync(cachePath, bytecode, 'utf8');
                }

                return bytecode;
            }
        },
    ];

    for (const fn of tries) {
        try {
            return await fn();
        } catch (err) {
            const msg = err instanceof Error ? err.message : err;
            trace('%s', msg);
        }
    }
    return null;
}

/** @param {(contract: Contract, argv: import('yargs').ArgumentsCamelCase) => void} handler */
function make(handler) {
    /** @param {import('yargs').ArgumentsCamelCase} argv */
    return async argv => {
        const pathOrAddress = /** @type {string} */ (argv['contract']);
        const cache = /**@type {boolean}*/(argv['cache']);
        const rpcUrl = /**@type {string}*/(argv['rpc-url']);
        const bytecode = await getBytecode(pathOrAddress, cache, rpcUrl);
        const name = pathOrAddress === '' ? '-' : pathOrAddress;
        if (bytecode === null) {
            console.error(warn(`Cannot find bytecode for contract ${info(name)}`));
            process.exit(2);
        } else if (bytecode.toLowerCase() === '0x') {
            console.error(warn(`Bytecode for contract ${info(name)} is '0x', it might have been self-destructed or it is an EOA`));
            process.exit(3);
        } else {
            try {
                let contract = new Contract(bytecode);

                if (argv['patch']) {
                    const hash = '0x' + js_sha3.keccak256(contract.bytecode).substring(0, 20);
                    trace('Bytecode keccak256 hash', hash);
                    const abisFolder = path.join(paths.cache, 'abis');
                    const abiPath = path.join(abisFolder, `${hash}.abi.json`);
                    /** @type {object | undefined} */
                    let lookup;
                    if (cache && existsSync(abiPath)) {
                        trace('Found ABI cache %s', abiPath);
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        lookup = JSON.parse(readFileSync(abiPath, 'utf8'));
                    } else {
                        if (cache) trace('ABI cache %s not found', abiPath);
                        else trace('Cache ABI disabled');
                        lookup = {};
                    }

                    contract = await contract.patch(lookup);
                    if (cache && !existsSync(abiPath)) {
                        if (!existsSync(abisFolder)) {
                            mkdirSync(abisFolder, { recursive: true });
                        }
                        writeFileSync(abiPath, JSON.stringify(lookup, null, 2));
                    }
                }

                handler(contract, argv);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                console.error(`${err}`);
                process.exit(1);
            }
        }
    };
}

/** @param {import('yargs').Argv} argv */
const pos = argv => argv.positional('contract', {
    type: 'string',
    describe: 'Path or a Ethereum address where to locate the bytecode of the contract. When `-` is used, bytecode will be read from standard input.',
});

/** @param {import('yargs').Argv} argv */
const decompileOpts = argv => pos(argv).option('reduce', {
    description: `Simplify the contract by reducing statements and inlining expressions before decompiling ${warn('[experimental]')}`,
});

void yargs(process.argv.slice(2))
    .scriptName('sevm')
    .usage('$0 <cmd> <contract>\n\nCLI tool to analyze EVM bytecode')
    .command('metadata <contract>', 'Shows the Metadata of the contract[1]', pos, make(contract => {
        console.info(c.underline('Contract Metadata'));
        if (contract.metadata) {
            console.info(c.blue('protocol'), contract.metadata.protocol);
            console.info(c.blue('hash'), contract.metadata.hash);
            console.info(c.blue('solc'), contract.metadata.solc);
            console.info(c.blue('url'), contract.metadata.url);
        } else {
            console.info(warn('No metadata'));
        }
    }))
    .command('abi <contract>', 'Shows the ABI of the contract[2]', pos, make(contract => {
        const functions = Object.values(contract.functions)
            .map(fn => ['0x' + fn.selector, fn.label]);
        const events = Object.entries(contract.events)
            .map(([selector, event]) => ['0x' + selector, event.sig]);

        const notfound = c.dim('<selector not found>');
        console.info(c.underline('Function Selectors'));
        functions.forEach(([selector, sig]) => console.info(' ', selector, sig !== undefined ? c.cyan(sig) : notfound));
        console.info();
        console.info(c.underline('Events'));
        events.forEach(([selector, sig]) => console.info(' ', selector, sig !== undefined ? c.magenta(sig) : notfound));
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
    .command('cfg <contract>', 'Writes the cfg of the selected function in `dot` format into standard output', pos, make(cfg))
    .command('sol <contract>', "Decompile the contract into Solidity-like source", decompileOpts, make((contract, argv) => {
        console.info((argv['reduce'] ? contract.reduce() : contract).solidify());
    }))
    .command('yul <contract>', "Decompile the contract into Yul-like source[4]", decompileOpts, make((contract, argv) => {
        console.info((argv['reduce'] ? contract.reduce() : contract).yul());
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
        description: 'Displays with colors, use `--no-color` to deactivate colors',
        default: true,
    })
    .option('patch', {
        type: 'boolean',
        description: 'Patches the Contract public functions and events with signatures from https://openchain.xyz, use `--no-patch` to skip patching',
        default: true,
    })
    .option('cache', {
        type: 'boolean',
        description: 'Enables cache of contracts and ABIs fetched from remote networks and https://openchain.xyz respectively, use `--no-cache` to skip catching',
        default: true,
    })
    .option('rpc-url', {
        type: 'string',
        description: 'JSON-RPC network provider URL',
        default: 'https://cloudflare-eth.com/',
    })
    // .option('selector', {
    //     alias: 's',
    //     type: 'string',
    //     description:
    //         'Function signature, e.g., `balanceOf(address)` or selector hash to choose a specific function',
    // })
    .demandCommand(1, 'At least one command must be specified')
    .recommendCommands()
    .example('$0 abi 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', '')
    .example('$0 sol 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', '')
    .example('$0 sol --no-patch 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', '')
    .example('echo 0x600160020160005500 | sevm yul -', 'Use `-` to read bytecode from stdin')
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
    /** @type {WeakMap<import('sevm').State, string>} */
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
     * @param {import('sevm').State} state
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
     * @param {import('sevm').State} src
     * @param {import('sevm/ast').Branch} branch
     */
    function writeEdge(src, branch) {
        const id = ids.get(src);
        edges += `"${id}" -> "${ids.get(branch.state)}";\n`;
    }
}
