import { strict as assert } from 'assert';
import { expect } from 'chai';

import { Contract, sol, yul, type State } from 'sevm';
import type { Branch, Expr, Inst } from 'sevm/ast';

import { compile } from './utils/solc';

describe('::contracts', function () {
    const t = (title: string, src: string, options?: Parameters<typeof compile>[3]) =>
        ({ title, src, options });

    Object.entries<{ title: string, src: string }[]>({
        empty: [
            t('with no functions', `contract Test { }`),
        ],
        locals: [
            t('no dedup local var', `contract Test {
                event Deposit(uint256);
                fallback () external payable {
                    uint256 n = block.number;
                    emit Deposit(n);
                    emit Deposit(n);
                }
            }`),
        ],
        dispatch: [
            t('pure functions', `contract Test {
                function get() external pure returns (uint256) { return 1; }
                function getPayable() external payable returns (uint256) { return 1; }
            }`),
        ],
        mappings: [
            t('public mapping', `contract Test {
                mapping (address => mapping (address => uint256)) public allowance;
                function getValue() external view returns (uint256) {
                    return allowance[msg.sender][msg.sender];
                }
            }`),
        ],
        control: [
            t('bounded for-loop', `contract Test {
                uint256 value;
                fallback() external payable {
                    for (uint256 i = 0; i < block.number; i++) value = i;
                }
            }`),
        ],
        system: [
            t('selfdestruct', `contract Test {
                fallback() external payable {
                    selfdestruct(payable(msg.sender));
                }
            }`),
        ],
    }).forEach(([name, contracts]) => {
        describe(name, function () {
            contracts.forEach(({ title, src }) => {
                [undefined, { optimizer: { enabled: true } }].forEach(options => {
                    const root = `contracts/${name}/${title}`;
                    const suffix = options === undefined ? '-no-opt' : '-opt';

                    describe(title + suffix, function () {
                        let contract: Contract;

                        before(function () {
                            contract = new Contract(compile(src, '0.7.6', this, options).bytecode).patch();
                        });

                        it(`should match Solidity snapshot`, function () {
                            expect(contract.solidify()).to.matchSnapshot('solidity', this, [root, suffix]);
                        });

                        it(`should match Yul snapshot`, function () {
                            expect(contract.yul()).to.matchSnapshot('yul', this, [root, suffix]);
                        });

                        it(`should match CFG snapshot`, function () {
                            expect(cfg(contract, title + suffix)).to.matchSnapshot('mermaid', this, [root, suffix]);
                        });
                    });
                });
            });
        });
    });
});

function cfg(evm: Contract, title: string) {
    const fnEntries = Object.fromEntries([...evm.functionBranches.values()].map(br => [br.pc, true]));

    const ids = new WeakMap<State<Inst, Expr>, string>();
    let id = 0;
    for (const block of evm.blocks.values()) {
        for (const state of block.states) {
            assert(!ids.has(state));

            if (!ids.has(state)) {
                ids.set(state, `s_${id}`);
                id++;
            }
        }
    }

    let output = '';
    const write = (content: string) => output += content + '\n';

    write('---');
    write(`title: ${title}`);
    write('---');
    write('flowchart TD');
    write(`  classDef state text-align:left`);

    let edges = '';
    for (const [pc, block] of evm.blocks) {
        write(`  subgraph cluster_${pc} [pc @${pc}]`);

        for (const state of block.states) {
            writeNode(pc, state, pc === 0 || fnEntries[pc] === true);
            switch (state.last?.name) {
                case 'Jumpi':
                    writeEdge(state, state.last.destBranch, '- jumpi -');
                    writeEdge(state, state.last.fallBranch, '. fall .');
                    break;
                case 'SigCase':
                    writeEdge(state, state.last.fallBranch, '. fall .');
                    break;
                case 'Jump':
                    writeEdge(state, state.last.destBranch, '- jump -');
                    break;
                case 'JumpDest':
                    writeEdge(state, state.last.fallBranch, '. jumpdest .');
                    break;
                default:
            }
        }
        write('  end');
    }
    output += edges;
    return output;

    function writeNode(pc: number, state: State<Inst, Expr>, entry: boolean) {
        const id = ids.get(state);
        let label = `pc @${pc} (${id})`;
        label += '\n';
        label += '=|' + state.stack.values.map(elem => yul`${elem}`).join('|');
        label += '\n';
        label += state.stmts.map(stmt => sol`${stmt}`).join('\n');
        label += '\n';

        const [open, close] = entry ? ['[[', ']]'] : ['(', ')'];

        write(`    ${id}${open}"${label}"${close}`);
        write(`    class ${id} state`);
        if (entry)
            write(`    style ${id} fill:#${pc === 0 ? '471C21' : '5F021F'}`);
    }

    function writeEdge(src: State<Inst, Expr>, branch: Branch, text: string = '') {
        const id = ids.get(src);
        edges += `  ${id} -${text}-> ${ids.get(branch.state)};\n`;
    }
}