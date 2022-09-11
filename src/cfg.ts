import { formatOpcode, Opcode, OPCODES } from './opcode';
import { State } from './state';
import {
    Expr,
    Invalid,
    isVal,
    Jump,
    JumpDest,
    Jumpi,
    Return,
    Revert,
    Sig,
    SigCase,
    Stop,
    Val,
} from './ast';
import { assert } from './error';

export class Branch {
    private constructor(readonly path: number[], readonly state: State) {}

    static from(pc: number, state: State) {
        return new Branch([pc], state);
    }

    to(pc: number, state: State): Branch {
        return new Branch([...this.path, pc], state);
    }

    get pc(): number {
        return this.path.at(-1)!;
    }

    get key() {
        return (
            this.pc +
            ':' +
            this.state.stack.values
                .filter((elem): elem is Val => elem instanceof Val && elem.isJumpDest)
                .map(val => 'j' + val.value.toString())
                .join('|')
        );
    }
}

/**
 *
 */
export class Block {
    /**
     * The `Opcodes` belonging to this `Block`.
     * This sequence of `Opcode`s does not contain branches except at the `end`.
     */
    readonly opcodes: Opcode[] = [];

    /**
     *
     */
    readonly state: State;

    constructor(readonly branch: Branch) {
        this.state = branch.state.clone();
    }

    /**
     * The first `Opcode` in this `Block`.
     */
    get begin(): Opcode {
        return this.opcodes[0];
    }

    /**
     * The last `Opcode` in this `Block`.
     * If this `Block` is well-formed,
     * `end` should be on of `STOP`, `RETURN`, `INVALID`, `JUMP`, `JUMPI`, `REVERT`.
     */
    get end(): Opcode {
        return this.opcodes[this.opcodes.length - 1];
    }

    get pc(): number {
        return this.branch.pc;
    }

    get key(): string {
        return this.branch.key;
    }

    get stack(): State['stack'] {
        return this.state.stack;
    }

    get stmts(): State['stmts'] {
        return this.state.stmts;
    }

    get memory(): State['memory'] {
        return this.state.memory;
    }
}

/**
 *
 */
export class ControlFlowGraph {
    /**
     *
     */
    readonly blocks: { [pc: string]: Block };

    /**
     *
     */
    readonly entry: string;

    /**
     *
     */
    readonly functionBranches: { hash: string; pc: number; state: State }[];

    /**
     *
     * @param opcodes
     * @param dispatch
     * @param start
     */
    constructor(
        opcodes: Opcode[],
        dispatch: {
            [mnemonic in Exclude<keyof typeof OPCODES, 'JUMP' | 'JUMPI'>]: (
                opcode: Opcode,
                state: State
            ) => void;
        },
        start: { pc: number; state: State }
    ) {
        this.functionBranches = [];

        const branches: Branch[] = [Branch.from(start.pc, start.state)];
        const blockLists: { [pc: number]: Block[] } = {};
        this.entry = branches[0].key;

        while (branches.length > 0) {
            // The non-null assertion operator `!` is required because the guard does not track array's emptiness.
            // See https://github.com/microsoft/TypeScript/issues/30406.
            const branch = branches.pop()!;
            assert(!branch.state.halted);

            if (!(branch.pc in blockLists)) {
                blockLists[branch.pc] = [];
            }

            const block = new Block(branch);
            blockLists[branch.pc].push(block);

            for (let pc = branch.pc; !block.state.halted && pc < opcodes.length; pc++) {
                const opcode = opcodes[pc];

                block.opcodes.push(opcode);

                if (opcode.mnemonic === 'JUMP') {
                    const offset = block.state.stack.pop();
                    const dest = getDest(offset);

                    const destBranch = makeBranch(branch, dest.pc, block.state);
                    block.state.stmts.push(new Jump(offset, destBranch));
                    block.state.halted = true;
                } else if (opcode.mnemonic === 'JUMPI') {
                    const offset = block.state.stack.pop();
                    const condition = block.state.stack.pop();

                    const dest = getDest(offset);
                    const fallBranch = makeBranch(branch, opcode.pc + 1, block.state);
                    if (condition instanceof Sig) {
                        this.functionBranches.push({
                            hash: condition.hash,
                            pc: dest.pc,
                            state: block.state.clone(),
                        });
                        block.state.stmts.push(new SigCase(condition, fallBranch));
                    } else {
                        const destBranch = makeBranch(branch, dest.pc, block.state);
                        block.state.stmts.push(
                            new Jumpi(condition, offset, fallBranch, destBranch)
                        );
                    }
                    block.state.halted = true;
                } else {
                    try {
                        dispatch[opcode.mnemonic](opcode, block.state);
                    } catch (err) {
                        throw new Error(
                            '`' +
                                err +
                                `\` at [${opcode.offset}] ${
                                    opcode.mnemonic
                                } =| ${block.state.stack.values.join(' | ')}`
                        );
                    }
                }

                if (
                    !block.state.halted &&
                    pc < opcodes.length + 1 &&
                    opcodes[pc + 1].mnemonic === 'JUMPDEST'
                ) {
                    const fallBranch = makeBranch(branch, opcode.pc + 1, block.state);
                    block.state.stmts.push(new JumpDest(fallBranch));
                    block.state.halted = true;
                }
            }

            assert(block.state.halted);
            assert(!branch.state.halted);
        }

        this.blocks = {};
        for (const [, blockList] of Object.entries(blockLists)) {
            for (const block of blockList) {
                const key = block.key;
                if (!(key in this.blocks)) {
                    this.blocks[key] = block;
                } else {
                    // this.blocks[key] = block;
                }
            }
        }

        this.verify();

        /**
         *
         * @param offset
         */
        function getDest(offset: Expr): Opcode {
            if (!isVal(offset)) {
                throw new Error('Expected numeric offset, found' + offset.toString());
            }

            const dest = opcodes.find(o => o.offset === Number(offset.value));
            if (!dest) {
                throw new Error('Expected `JUMPDEST` in JUMP destination, but found is undefined');
            }

            if (dest.mnemonic !== 'JUMPDEST') {
                throw new Error(
                    'Expected `JUMPDEST` in JUMP destination, found' + formatOpcode(dest)
                );
            }

            offset.isJumpDest = true;
            return dest;
        }

        /**
         *
         * @param from
         * @param pc
         * @param state
         * @returns
         */
        function makeBranch(from: Branch, pc: number, state: State): Branch {
            const c = from.path.filter(p => p === pc && p !== from.pc);
            // check(c.length <= 1, 'pc length ' + c.length.toString());
            if (c.length >= 1) {
                const backEdgeKey = from.to(pc, state);
                assert(
                    blockLists[backEdgeKey.pc] !== undefined,
                    'back key undef' + backEdgeKey + ' ' + from.path.join('->')
                );

                for (const block of blockLists[backEdgeKey.pc]) {
                    // console.log(block.key, backEdgeKey.key);
                    if (block.key === backEdgeKey.key) {
                        // console.log('---',block.key, backEdgeKey.key);
                        return backEdgeKey;
                    }
                }
            }

            const to = from.to(pc, state.clone());
            branches.push(to);
            return to;
        }
    }

    /**
     *
     */
    private verify() {
        const HALTS = ['STOP', 'RETURN', 'INVALID', 'JUMP', 'JUMPI', 'REVERT'];

        for (const block of Object.values(this.blocks)) {
            assert(!block.branch.state.halted);
        }

        const pcs: number[] = [];
        for (const [, block] of Object.entries(this.blocks)) {
            assert(block.opcodes.length > 0);
            assert(block.opcodes.filter(opcode => HALTS.includes(opcode.mnemonic)).length <= 1);
            assert(!block.branch.state.halted);

            const last = block.stmts.at(-1);

            assert(
                (block.end.mnemonic === 'STOP' && last instanceof Stop) ||
                    (block.end.mnemonic === 'RETURN' && last instanceof Return) ||
                    (block.end.mnemonic === 'REVERT' && last instanceof Revert) ||
                    (block.end.opcode === OPCODES.INVALID && last instanceof Invalid) ||
                    (block.end.mnemonic === 'JUMP' &&
                        last instanceof Jump &&
                        last.destBranch.key in this.blocks) ||
                    (block.end.mnemonic === 'JUMPI' &&
                        (last instanceof Jumpi || last instanceof SigCase)) ||
                    (!HALTS.includes(block.end.mnemonic) && last instanceof JumpDest),
                block.end.mnemonic,
                block.stmts
            );

            // assert(block.opcodes.filter(opcode => pcs.includes(opcode.pc)).length === 0);
            pcs.push(...block.opcodes.map(opcode => opcode.pc));
        }
    }
}

// export function pprint({ blocks }: ControlFlowGraph) {
//     for (const [pc, block] of Object.entries(blocks)) {
//         console.log(pc, ':', block.entry.offset);
//         block.opcodes.forEach(op => console.log('  ', formatOpcode(op)));
//         console.log('  =| ', block.stack.values.join(' | '));
//         block.stmts.forEach(stmt => console.log('  ', stmt.toString()));
//     }
// }
