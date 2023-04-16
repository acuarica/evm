const { readFileSync } = require('fs');
const yargs = require('yargs');
const chalk = require('chalk');
const blessed = require('blessed');
const assert = require('assert');

const { Contract, stringify } = require('@acuarica/evm');
require('@acuarica/evm/selector');

const { formatOpcode, toHex } = require('@acuarica/evm/opcode');
const { EVM, Branch } = require('@acuarica/evm/evm');

const underline = chalk.underline;
const blue = chalk.blue;
const dim = chalk.dim;
const magenta = chalk.magenta;
const red = chalk.red;

/**
 * 
 * @param {string} path 
 * @returns 
 */
function getContract(path) {
    const bytecode = readFileSync(path, 'utf8');
    return new Contract(bytecode).patch();
}

/**
 * 
 * @param {import('@acuarica/evm/opcode').Opcode} opcode 
 * @returns 
 */
function ansiOpcode(opcode) {
    const pc = opcode.pc.toString().padStart(6).toUpperCase();
    const offset = ('0x' + opcode.offset.toString(16)).padStart(8);
    const pushData = opcode.pushData
        ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${toHex(opcode.pushData)}`
        : '';
    return `${dim(pc)} ${blue(offset)}  ${magenta(opcode.mnemonic)}    ${pushData}`;
}

/**
 * 
 * @param {import('yargs').Argv} argv 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
const pathArg = (argv) =>
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
        /**
         * 
         * @param {import('yargs').Argv} yargs 
         */
        (yargs) => {
            pathArg(yargs);
        },
        function (argv) {
            const contract = getContract(/** @type {string} */(argv['path']));

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
        /**
         * 
         * @param {import('yargs').Argv} yargs 
         */
        (yargs) => {
            pathArg(yargs);
        },
        function (argv) {
            console.info(
                `${dim('index'.padStart(6))} ${blue('pc'.padStart(8))}  ${magenta(
                    'mnemonic'
                )}  ${'push data (PUSHx)'}`
            );
            const contract = getContract(/** @type {string} */(argv['path']));

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
        /**
         * @param {import('yargs').Argv} yargs 
         */
        (yargs) => {
            pathArg(yargs);
        },
        function (argv) {
            const contract = getContract(/** @type {string} */(argv['path']));
            writeDot(contract.evm);
        }
    )

    .command(
        'decompile [path]',
        'Decompile',
        /**
         * @param {import('yargs').Argv} yargs 
         */
        (yargs) => {
            pathArg(yargs);
        },
        function (argv) {
            const contract = getContract(/** @type {string} */(argv['path']));
            console.info(contract.decompile());
        }
    )

    .command(
        'console [path]',
        'Console',
        /**
         * @param {import('yargs').Argv} yargs 
         */
        (yargs) => {
            pathArg(yargs);
        },
        function (argv) {
            const contract = getContract(/** @type {string} */(argv['path']));
            showConsole(contract);
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

/**
 * 
 * @param {EVM} evm 
 */
function writeDot(evm) {
    const write = console.log;
    write(`digraph G {    
    color="#efefef";
    #rankdir = LR;
    #graph[fontsize=6];

    node[shape=box style=filled fontsize=12 fontname="Verdana" fillcolor="#efefef"];
    `);

    /** @type {WeakMap<import('@acuarica/evm/evm').EVMState, string>} */
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
     * 
     * @param {EVM} evm
     */
    function dot(evm) {
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

        /**
         * 
         * @param {number} pc 
         * @param {import('@acuarica/evm/evm').EVMState} state 
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
            label += state.stack.values.map(elem => `=| ${elem.eval().toString()}`).join('');
            label += '\\l';
            // label += inspect(state.memory);
            // label += '\\l';
            Object.entries(state.memory).forEach(([k, v]) => (label += `${k}: ${v}\\l`));
            label += state.stmts.map(stmt => stmt.toString()).join('\\l');
            label += '\\l';

            write(`"${id}" [label="${label}" fillcolor="${'#ffa500'}"];`);
        }

        /**
         * 
         * @param {import('@acuarica/evm/evm').EVMState} src 
         * @param {Branch} branch 
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

/**
 * 
 * @param {Contract} contract 
 */
function showConsole(contract) {
    const screen = blessed.screen({ smartCSR: true });
    screen.title = 'my window title';

    const box = blessed.box({
        parent: screen,
        // top: 'center',
        // left: 'center',
        right: 0,
        width: '80%',
        // height: '50%',
        content: 'Hello {bold}world{/bold}!',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            // bg: 'magenta',
            border: {
                fg: '#f0f0f0'
            },
            // hover: {
            //     bg: 'green'
            // }
        }
    });

    // Append our box to the screen.
    // screen.append(box);

    // If our box is clicked, change the content.
    // box.on('click', function (data) {
    //     box.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
    //     screen.render();
    // });

    // If box is focused, handle `enter`/`return` and give us some more content.
    // box.key('enter', function (ch, key) {
    //     box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
    //     box.setLine(1, 'bar');
    //     box.insertLine(1, 'foo');
    //     screen.render();
    // });

    // Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c'], function (_ch, _key) {
        return process.exit(0);
    });

    blessed.box({
        parent: screen,
        label: ' {bold}{cyan-fg}Metadata{/cyan-fg}{/bold} ',
        width: '20%',
        height: '20%',
        content: getMetadata(contract.metadata),
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            border: {
                fg: '#f0f0f0'
            },
        }
    });

    const functionList = blessed.list({
        parent: screen,
        label: ' {bold}{cyan-fg}Functions{/cyan-fg}{/bold} ',
        tags: true,
        top: '20%',
        width: '20%',
        height: '40%',
        keys: true,
        vi: true,
        // mouse: true,
        border: 'line',
        scrollbar: {
            ch: ' ',
            track: {
                bg: 'cyan'
            },
            style: {
                inverse: true
            }
        },
        style: {
            item: {
                hover: {
                    bg: 'blue'
                }
            },
            selected: {
                bg: 'blue',
                bold: true
            }
        },
        search: function (_callback) {
            // prompt.input('Search:', '', function (err, value) {
            //     if (err) return;
            //     return callback(null, value);
            // });
        },
    });
    functionList.on('select item', elem => {
        const fn = fns[elem.getText()];
        box.setContent(fn.decompile());
        screen.render();
    });

    const entries = [
        /** @type {const} */(['main', { decompile: () => stringify(contract.main) } ]) ,
        ...Object.entries(contract.functions).map(([selector, fn]) => /**@type{const}*/([fn.label ?? selector, fn]))
    ];
    const fns = Object.fromEntries(entries);
    functionList.setItems(Object.keys(fns));

    const eventList = blessed.list({
        parent: screen,
        label: ' {bold}{cyan-fg}Events{/cyan-fg}{/bold} ',
        tags: true,
        bottom: 0,
        width: '20%',
        height: '40%',
        keys: true,
        vi: true,
        border: 'line',
    });
    eventList.setItems(contract.getEvents());

    functionList.focus();
    screen.render();
}

/**
 * 
 * @param {EVM['metadata']} metadata 
 */
function getMetadata(metadata) {
    return metadata ? `solc ${metadata.solc} ${metadata.url}` : '--';
}