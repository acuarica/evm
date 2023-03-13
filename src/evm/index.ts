import { formatOpcode, type Opcode } from '../opcode';
import type { Stack, State as TState } from '../state';
import type { Expr, Stmt } from './ast';

import { PUSHES, STACK } from './stack';
import { MATH } from './math';
import { LOGIC } from './logic';
import { ENV } from './env';
import { SYM as SYMBOLS } from './sym';
import { MEMORY } from './memory';
import { INVALID, PC, SYSTEM } from './system';
import { LOGS, type IEvents } from './log';

// import { STORAGE } from './storage';

import { assert } from '../error';

type State = TState<Stmt, Expr>;

function make<F, T extends { [mnemonic: string]: F }>(
    table: T,
    adapter: (fn: F) => (opcode: Opcode, state: State) => void
) {
    return Object.fromEntries(
        Object.entries(table).map(([mnemonic, fn]) => [mnemonic, adapter(fn)])
    ) as { [mnemonic in keyof T]: (opcode: Opcode, state: State) => void };
}

function makeStack<T extends { [mnemonic: string]: (stack: Stack<Expr>) => void }>(table: T) {
    return make(table, (fn: (stack: Stack<Expr>) => void) => (_opcode, state) => fn(state.stack));
}

function makeState<T extends { [mnemonic: string]: (state: State) => void }>(table: T) {
    return make(table, (fn: (state: State) => void) => (_opcode, state) => fn(state));
}

const TABLE = {
    ...makeStack(MATH),
    ...makeStack(LOGIC),
    ...makeStack(ENV),
    ...makeState(SYMBOLS),
    ...makeState(MEMORY),
    JUMPDEST: (_opcode: Opcode, _state: State) => {},
    ...make(
        PUSHES,
        (fn: (pushData: Uint8Array, stack: Stack<Expr>) => void) => (opcode, state) =>
            fn(opcode.pushData!, state.stack)
    ),
    ...makeStack(STACK<Expr>()),
    ...makeState(SYSTEM),
    PC,
    INVALID,
};

export function EVM(opcodes: Opcode[], events: IEvents) {
    const insts = {
        ...TABLE,
        // ...STORAGE(contract),
        ...LOGS(events),
    };

    return {
        opcodes,
        exec(pc0: number, state: State) {
            for (let pc = pc0; !state.halted && pc < opcodes.length; pc++) {
                const opcode = opcodes[pc];

                // block.opcodes.push(opcode);

                if (opcode.mnemonic === 'JUMP') {
                    const offset = state.stack.pop();
                    const dest = getDest(offset);

                    // const destBranch = makeBranch(branch, dest.pc, state);
                    // state.stmts.push(new Jump(offset, destBranch));
                    state.halted = true;
                } else if (opcode.mnemonic === 'JUMPI') {
                    const offset = state.stack.pop();
                    const condition = state.stack.pop();

                    const dest = getDest(offset);
                    // const fallBranch = makeBranch(branch, opcode.pc + 1, state);
                    // if (condition instanceof Sig) {
                    //     this.functionBranches.push({
                    //         hash: condition.hash,
                    //         pc: dest.pc,
                    //         state: state.clone(),
                    //     });
                    //     state.stmts.push(new SigCase(condition, fallBranch));
                    // } else {
                    //     const destBranch = makeBranch(branch, dest.pc, state);
                    //     state.stmts.push(new Jumpi(condition, offset, fallBranch, destBranch));
                    // }
                    state.halted = true;
                } else {
                    try {
                        // dispatch[opcode.mnemonic](opcode, state);
                        insts[opcode.mnemonic as keyof typeof insts](opcode, state);
                    } catch (err) {
                        const message = (err as Error).message;
                        throw new Error(
                            `\`${message}\` at [${opcode.offset}] ${
                                opcode.mnemonic
                            } =| ${state.stack.values.join(' | ')}`
                        );
                    }
                }

                if (
                    !state.halted &&
                    pc < opcodes.length + 1 &&
                    opcodes[pc + 1].mnemonic === 'JUMPDEST'
                ) {
                    // const fallBranch = makeBranch(branch, opcode.pc + 1, state);
                    // state.stmts.push(new JumpDest(fallBranch));
                    state.halted = true;
                }
            }

            assert(state.halted);
            // assert(!branch.state.halted);

            /**
             *
             * @param offset
             */
            function getDest(offset: Expr): Opcode {
                const offset2 = offset.eval();
                if (!offset2.isVal()) {
                    throw new Error('Expected numeric offset, found' + offset.toString());
                }

                const dest = opcodes.find(o => o.offset === Number(offset2.val));
                if (!dest) {
                    throw new Error(
                        'Expected `JUMPDEST` in JUMP destination, but found is undefined'
                    );
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

            // function makeBranch(from: Branch, pc: number, state: State): Branch {
            //     const to = from.to(pc, state.clone());
            //     branches.unshift(to);
            //     return to;
            // }
        },
    };
}
