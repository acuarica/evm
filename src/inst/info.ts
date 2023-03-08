import type { Stack } from '../state';
import { CallDataLoad, CALLDATASIZE, CallValue, type Expr } from '../ast';

export const INFO = {
    // Environmental Information (since Frontier)
    CALLVALUE: (stack: Stack<Expr>): void => {
        stack.push(new CallValue());
    },
    CALLDATALOAD: (stack: Stack<Expr>): void => {
        const location = stack.pop();
        stack.push(new CallDataLoad(location));
    },
    CALLDATASIZE: (stack: Stack<Expr>): void => {
        stack.push(new CALLDATASIZE());
    },
};
