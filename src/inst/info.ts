import { Stack } from '../stack';
import { CallDataLoad, CALLDATASIZE, CallValue, Expr } from '../ast';

export const INFO = {
    // Environmental Information (since Frontier)
    CALLVALUE: (stack: Stack<Expr>) => {
        stack.push(new CallValue());
    },
    CALLDATALOAD: (stack: Stack<Expr>) => {
        const location = stack.pop();
        stack.push(new CallDataLoad(location));
    },
    CALLDATASIZE: (stack: Stack<Expr>) => {
        stack.push(new CALLDATASIZE());
    },
};
