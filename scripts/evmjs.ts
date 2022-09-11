import { readFileSync } from 'fs';
import { Jump, JumpDest, Jumpi } from '../src/ast';
import { Block, ControlFlowGraph } from '../src/cfg';
import { formatOpcode } from '../src/opcode';
import EVM from '../test/utils/evmtest';

if (process.argv.length < 3) {
    throw new Error('Usage: evmjs <path>');
}

const path = process.argv[2];

export const bytecode = readFileSync(path, 'utf8');
const evm = new EVM(bytecode);

// evm.opcodes.forEach(op => console.error(formatOpcode(op)));
// dot(evm.contract.getFunction('balanceOf(uint256)')!.cfg);

const write = console.log;

write('digraph G {');
dot(evm.contract.main.cfg);
write('}');

function dot({ blocks }: ControlFlowGraph) {
    for (const [pc, block] of Object.entries(blocks)) {
        writeNode(pc, block);

        const last = block.stmts.at(-1);
        if (last instanceof Jumpi) {
            writeEdge(pc, last.destBranch!.key);
            writeEdge(pc, last.fallBranch!.key);
        } else if (last instanceof Jump) {
            writeEdge(pc, last.destBranch!.key);
        } else if (last instanceof JumpDest) {
            writeEdge(pc, last.fallBranch!.key);
        }
    }

    function writeNode(pc: string, block: Block) {
        let label = 'key:' + pc;
        // label += '\\l';
        // label += block.branch.state.stack.values.map(elem => '=| ' + elem).join('\\l');
        label += '\\l';
        label += block.opcodes.map(op => formatOpcode(op)).join('\\l');
        label += '\\l';
        label += block.stack.values.map(elem => '=| ' + elem).join('\\l');
        label += '\\l';
        label += block.stmts.map(stmt => stmt.toString()).join('\\l');

        write(`"${pc}" [label="${label}"];`);
    }

    function writeEdge(src: string, key: string) {
        write(`"${src}" -> "${key}";`);
    }
}
