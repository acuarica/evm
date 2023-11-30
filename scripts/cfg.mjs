#!/usr/bin/env node
/* eslint-env node */

import { readFileSync } from 'fs';

import { Contract, sol, formatOpcode } from 'sevm';

/**
 * @typedef {import('sevm').State<import('sevm/ast').Inst, import('sevm/ast').Expr>} EVMState
 */

function main() {
    const path = process.argv[2];
    const text = readFileSync(path, 'utf8');
    const { bytecode } = JSON.parse(text);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const contract = new Contract(bytecode);

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
            // assert(!ids.has(state));

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
     * @param {import('sevm').EVM} evm
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
            label += state.stack.values.map(elem => sol`=| ${elem}`).join('');
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

main();
