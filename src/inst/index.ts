export { PUSHES, STACK } from './stack';
export { MATH } from './math';
export { SYSTEM } from './system';
export { LOGIC } from './logic';

import type { Expr } from '../ast';
import type { Contract } from '../contract';
import type { Opcode } from '../opcode';
import type { Stack, State } from '../state';

import { PUSHES, STACK } from './stack';
import { INFO } from './info';
import { LOGS } from './log';
import { LOGIC } from './logic';
import { MATH } from './math';
import { MEMORY } from './memory';
import { STORAGE } from './storage';
import { SYMBOLS } from './symbols';
import { INVALID, SYSTEM } from './system';

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
    ...makeStack(INFO),
    ...makeState(SYMBOLS),
    ...makeState(MEMORY),
    PC: (opcode: Opcode, { stack }: State) => stack.push(BigInt(opcode.offset)),
    JUMPDEST: (_opcode: Opcode, _state: State) => {},
    ...make(
        PUSHES,
        (fn: (pushData: Uint8Array, stack: Stack<Expr>) => void) => (opcode, state) =>
            fn(opcode.pushData!, state.stack)
    ),
    ...makeStack(STACK),
    ...makeState(SYSTEM),
    INVALID,
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getDispatch(contract: Contract) {
    return {
        ...TABLE,
        ...STORAGE(contract),
        ...LOGS(contract),
        // ...JUMPS(opcodes, pcs),
    };
}
