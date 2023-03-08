import { formatOpcode, type Opcode, OPCODES } from './opcode';
import type { State } from './state';
import {
    evalExpr,
    type Expr,
    Invalid,
    isBigInt,
    isJumpDest,
    isVal,
    Jump,
    JumpDest,
    Jumpi,
    Phi,
    Return,
    Revert,
    Sig,
    SigCase,
    Stop,
    Val,
} from './ast';
import { assert, assertiif } from './error';

export class Branch {
    private constructor(readonly path: { readonly pc: number; readonly state: State }[]) {}

    static from(pc: number, state: State): Branch {
        return new Branch([{ pc, state }]);
    }

    to(pc: number, state: State): Branch {
        return new Branch([...this.path, { pc, state }]);
    }

    get pc(): number {
        return this.path.at(-1)!.pc;
    }

    get state(): State {
        return this.path.at(-1)!.state;
    }

    get pred(): Branch | null {
        return this.path.length === 1 ? null : new Branch(this.path.slice(0, -1));
    }

    get key(): string {
        return (
            this.pc.toString() +
            ':' +
            this.state.stack.values
                .filter((elem): elem is Val => elem instanceof Val && elem.isJumpDest !== null)
                .map(val => 'j' + val.isJumpDest!.toString())
                .join('|')
        );
    }
}

const HALTS = ['STOP', 'RETURN', 'INVALID', 'REVERT'];

type ExitInst = Jumpi | SigCase | Jump | JumpDest;

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
    readonly preds: string[] = [];

    /**
     *
     */
    readonly state: State;

    constructor(readonly entry: Branch) {
        this.state = entry.state.clone();
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

    get key(): string {
        return this.entry.key;
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

    get last(): ExitInst {
        return this.state.stmts.at(-1)! as ExitInst;
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

    readonly doms: { [key: string]: Set<string> } = {};

    readonly treed: { [key: string]: Set<string> } = {};

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
            const branch = branches.shift()!;
            assert(!branch.state.halted);

            if (!(branch.pc in blockLists)) {
                blockLists[branch.pc] = [];
            }

            let seen = false;
            for (const b of blockLists[branch.pc]) {
                if (
                    b.key === branch.key
                    // && b.branch.state.stack.length === branch.state.stack.length
                ) {
                    // assert(b.branch.state.stack.length === branch.state.stack.length);

                    // console.log('  paths' , b.key);
                    // console.log('  l',b.branch.path.map(p=>Branch.from(p.pc,p.state).key));
                    // console.log('  r', branch.path.map(p=>Branch.from(p.pc,p.state).key));
                    // for (let i=-0; i <  b.branch.path.length; i++) {
                    //     console.log(b.branch.path[i].pc, branch.path[i].pc);
                    // }
                    seen = true;
                }
            }

            const block = new Block(branch);
            blockLists[branch.pc].push(block);

            if (seen) continue;

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
                        const message = (err as Error).message;
                        throw new Error(
                            `\`${message}\` at [${opcode.offset}] ${
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
                    if (block.entry.pred !== null) {
                        this.blocks[key].preds.push(block.entry.pred.key);
                    }
                } else {
                    if (HALTS.includes(this.blocks[key].last.name)) {
                        continue;
                    }

                    if (block.entry.pred !== null) {
                        this.blocks[key].preds.push(block.entry.pred.key);
                    }

                    const left = this.blocks[key].entry.state.stack.values;
                    const right = block.entry.state.stack.values;

                    // assert(left.length === right.length, key, this.blocks[key].branch.state.stack.values, block.branch.state.stack.values);

                    for (let i = 0; i < Math.min(left.length, right.length); i++) {
                        if (left[i].toString() !== right[i].toString()) {
                            assertiif(
                                isJumpDest(left[i]),
                                isJumpDest(right[i]),
                                'jump dest non-unified at',
                                i,
                                'left',
                                left[i],
                                'right',
                                right[i],
                                key
                            );

                            left[i] = new Phi(left[i], right[i]);
                        }
                    }
                }
            }
        }

        this.verify();
        dominatorTree(this);

        {
            const makeKey = (s: Set<string>) => [...s].sort().join('-');
            const wt: { [key: string]: string } = {};

            for (const [key, ds] of Object.entries(this.doms)) {
                wt[makeKey(ds)] = key;
            }

            for (const [key, ds] of Object.entries(this.doms)) {
                const x = new Set(ds);
                x.delete(key);
                const t = wt[makeKey(x)];
                if (this.treed[t] === undefined) {
                    this.treed[t] = new Set();
                }
                this.treed[t].add(key);
            }
            // console.log(this.treed);
            // console.log(this.doms);
        }

        /**
         *
         * @param offset
         */
        function getDest(offset: Expr): Opcode {
            const offset2 = evalExpr(offset);
            if (!isBigInt(offset2)) {
                throw new Error('Expected numeric offset, found' + offset.toString());
            }

            const dest = opcodes.find(o => o.offset === Number(offset2));
            if (!dest) {
                throw new Error('Expected `JUMPDEST` in JUMP destination, but found is undefined');
            }

            if (dest.mnemonic !== 'JUMPDEST') {
                throw new Error(
                    'Expected `JUMPDEST` in JUMP destination, found' + formatOpcode(dest)
                );
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (offset as any).isJumpDest = dest.pc;
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
            // const c = from.path.filter(p => p === pc && p !== from.pc);
            // check(c.length <= 1, 'pc length ' + c.length.toString());
            // if (c.length >= 1) {
            //     const backEdgeKey = from.to(pc, state);
            //     assert(
            //         blockLists[backEdgeKey.pc] !== undefined,
            //         'back key undef' + backEdgeKey + ' ' + from.path.join('->')
            //     );

            //     for (const block of blockLists[backEdgeKey.pc]) {
            // console.log(block.key, backEdgeKey.key);
            // if (block.key === backEdgeKey.key) {
            // console.log('---',block.key, backEdgeKey.key);
            // return backEdgeKey;
            //         }
            //     }
            // }

            const to = from.to(pc, state.clone());
            // branches.push(to);
            branches.unshift(to);
            return to;
        }
    }

    /**
     *
     */
    public verify() {
        const HALTS = ['STOP', 'RETURN', 'INVALID', 'JUMP', 'JUMPI', 'REVERT'];

        for (const block of Object.values(this.blocks)) {
            assert(!block.entry.state.halted);
        }

        const pcs: number[] = [];
        for (const [, block] of Object.entries(this.blocks)) {
            assert(block.opcodes.length > 0);
            assert(block.opcodes.filter(opcode => HALTS.includes(opcode.mnemonic)).length <= 1);
            assert(!block.entry.state.halted);

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

export function dominatorTree({ blocks, entry, doms }: ControlFlowGraph) {
    doms[entry] = new Set([entry]);

    for (const { key } of Object.values(blocks)) {
        if (key !== entry) {
            doms[key] = new Set(Object.keys(blocks));
        }
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const { key } of Object.values(blocks)) {
            if (key !== entry) {
                const ds = union(
                    new Set([key]),
                    intersect(blocks[key].preds.map(pred => doms[pred]))
                );
                if (!equal(ds, doms[key])) {
                    doms[key] = ds;
                    changed = true;
                }
            }
        }
    }

    function union<T>(left: Set<T>, right: Set<T>) {
        return new Set([...left, ...right]);
    }

    function intersect<T>(sets: Set<T>[]) {
        let result = sets[0];
        for (let i = 1; i < sets.length; i++) {
            result = _intersect(result, sets[i]);
        }
        return result;
    }

    function _intersect<T>(left: Set<T>, right: Set<T>) {
        return new Set([...left].filter(elem => right.has(elem)));
    }

    function equal<T>(left: Set<T>, right: Set<T>) {
        return left.size === right.size && [...left].every(elem => right.has(elem));
    }
}
