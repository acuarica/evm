import { type Expr, Val } from '../ast';
import type { State } from '../state';

// https://eips.ethereum.org/EIPS/eip-3855
export const STEP = {
    PUSH0: [
        0x5f,
        ({ stack }: State<never, Expr>): void => {
            stack.push(new Val(0n));
        },
    ],
};
