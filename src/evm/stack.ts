import { toHex } from '../opcode';
import { type Stack } from '../state';

import { type Expr, Val } from './expr';

export const PUSHES = {
    PUSH1: push,
    PUSH2: push,
    PUSH3: push,
    PUSH4: push,
    PUSH5: push,
    PUSH6: push,
    PUSH7: push,
    PUSH8: push,
    PUSH9: push,
    PUSH10: push,
    PUSH11: push,
    PUSH12: push,
    PUSH13: push,
    PUSH14: push,
    PUSH15: push,
    PUSH16: push,
    PUSH17: push,
    PUSH18: push,
    PUSH19: push,
    PUSH20: push,
    PUSH21: push,
    PUSH22: push,
    PUSH23: push,
    PUSH24: push,
    PUSH25: push,
    PUSH26: push,
    PUSH27: push,
    PUSH28: push,
    PUSH29: push,
    PUSH30: push,
    PUSH31: push,
    PUSH32: push,
};

function push(pushData: Uint8Array, stack: Stack<Expr>): void {
    stack.push(new Val(BigInt('0x' + toHex(pushData)), true));
}

export function STACK<E>() {
    return {
        POP: (stack: Stack<Expr>): void => void stack.pop(),
        DUP1: dup(0),
        DUP2: dup(1),
        DUP3: dup(2),
        DUP4: dup(3),
        DUP5: dup(4),
        DUP6: dup(5),
        DUP7: dup(6),
        DUP8: dup(7),
        DUP9: dup(8),
        DUP10: dup(9),
        DUP11: dup(10),
        DUP12: dup(11),
        DUP13: dup(12),
        DUP14: dup(13),
        DUP15: dup(14),
        DUP16: dup(15),
        SWAP1: swap(1),
        SWAP2: swap(2),
        SWAP3: swap(3),
        SWAP4: swap(4),
        SWAP5: swap(5),
        SWAP6: swap(6),
        SWAP7: swap(7),
        SWAP8: swap(8),
        SWAP9: swap(9),
        SWAP10: swap(10),
        SWAP11: swap(11),
        SWAP12: swap(12),
        SWAP13: swap(13),
        SWAP14: swap(14),
        SWAP15: swap(15),
        SWAP16: swap(16),
    };

    function dup(position: number) {
        return (stack: Stack<E>): void => stack.dup(position);
    }

    function swap(position: number) {
        return (stack: Stack<E>): void => stack.swap(position);
    }
}
