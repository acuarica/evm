import { sol, yul, type Contract, type State } from 'sevm';
import type { Branch } from 'sevm/ast';

export function cfg(contract: Contract, title: string): string {
    const fnEntries = Object.fromEntries([...contract.functionBranches.values()].map(br => [br.pc, true]));
    const s_ = (state: State) => `s_${state.id}`;

    let output = '';
    const write = (content: string) => output += content + '\n';

    write('---');
    write(`title: ${title}`);
    write('---');
    write('flowchart TD');
    write(`  classDef state text-align:left`);

    let edges = '';
    for (const [pc, block] of contract.blocks) {
        write(`  subgraph cluster_${pc} ["pc @${pc}"]`);

        for (const state of block.states) {
            writeNode(pc, state, pc === 0 || fnEntries[pc] === true);
            const last = state.last;
            switch (last?.name) {
                case 'Jumpi':
                    writeEdge(state, last.destBranch, `== jumpi${last.pushStateId}_${state.id} ==`);
                    writeEdge(state, last.fallBranch, '-- fall --');
                    if (last.pushStateId !== state.id)
                        edges += `  s_${last.pushStateId} -...- ${s_(state)};\n`;
                    break;
                case 'SigCase':
                    writeEdge(state, last.fallBranch, '-- fall --');
                    break;
                case 'Jump':
                    writeEdge(state, last.destBranch, `== jump${last.pushStateId}_${state.id} ==`);
                    if (last.pushStateId !== state.id)
                        edges += `  s_${last.pushStateId} -...- ${s_(state)};\n`;
                    break;
                case 'JumpDest':
                    writeEdge(state, last.fallBranch, '-- jumpdest --');
                    break;
                default:
            }
        }
        write('  end');
    }
    output += edges;
    return output;

    function writeNode(pc: number, state: State, entry: boolean) {
        const s_id = s_(state);
        let label = `pc @${pc} (#${s_id})`;
        label += '\n';
        label += '=|' + state.stack.values.map(elem => yul`${elem}`).join('|');
        label += '\n';
        label += state.stmts.map(stmt => sol`${stmt}`).join('\n');
        label += '\n';

        const [open, close] = entry ? ['[[', ']]'] : ['(', ')'];

        write(`    ${s_id}${open}"${label}"${close}`);
        write(`    class ${s_id} state`);
        if (entry)
            write(`    style ${s_id} fill:#${pc === 0 ? '471C21' : '5F021F'}`);
    }

    function writeEdge(src: State, branch: Branch, link: string) {
        const s_id = s_(src);
        edges += `  ${s_id} ${link}> ${s_(branch.state)};\n`;
    }
}
