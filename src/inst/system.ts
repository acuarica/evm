import {
    CALL,
    CALLCODE,
    CREATE,
    CREATE2,
    DELEGATECALL,
    evalExpr,
    Expr,
    Invalid,
    isBigInt,
    MLoad,
    Return,
    ReturnData,
    Revert,
    SelfDestruct,
    Sha3,
    STATICCALL,
    Stop,
} from '../ast';
import { Opcode } from '../opcode';
import { State } from '../state';

export function memArgs0<T>(
    offset: Expr,
    size: Expr,
    { memory }: State,
    Klass: new (args: Expr[], offset?: Expr, size?: Expr) => T
): T {
    const MAXSIZE = 1024;

    offset = evalExpr(offset);
    size = evalExpr(size);

    if (isBigInt(offset) && isBigInt(size) && size <= MAXSIZE * 32) {
        const args = [];
        for (let i = Number(offset); i < Number(offset + size); i += 32) {
            args.push(i in memory ? memory[i] : new MLoad(BigInt(i)));
        }

        return new Klass(args);
    } else {
        if (isBigInt(size) && size > MAXSIZE * 32) {
            throw new Error(`memargs size${Klass.toString()}${size}`);
        }

        return new Klass([], offset, size);
    }
}

export function memArgs<T>(
    state: State,
    Klass: new (args: Expr[], offset?: Expr, size?: Expr) => T
): T {
    const offset = state.stack.pop();
    const size = state.stack.pop();
    return memArgs0(offset, size, state, Klass);
}

export const SYSTEM = {
    SHA3: (state: State) => {
        state.stack.push(memArgs(state, Sha3));
    },
    STOP: (state: State) => {
        state.halted = true;
        state.stmts.push(new Stop());
    },

    CREATE: ({ stack }: State) => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE(memoryStart, memoryLength, value));
    },
    CALL: ({ stack, memory }: State) => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new CALL(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
        );

        // if (typeof outputStart !== 'number') {
        //     console.log('WARN:CALL outstart should be number');
        // }

        memory[outputStart as any as number] = new ReturnData(outputStart, outputLength);
    },
    CALLCODE: ({ stack }: State) => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();

        stack.push(
            new CALLCODE(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    RETURN: (state: State) => {
        state.halted = true;
        state.stmts.push(memArgs(state, Return));
    },
    DELEGATECALL: ({ stack }: State) => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new DELEGATECALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    CREATE2: ({ stack }: State) => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE2(memoryStart, memoryLength, value));
    },
    STATICCALL: ({ stack }: State) => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new STATICCALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    REVERT: (state: State) => {
        state.halted = true;
        state.stmts.push(memArgs(state, Revert));
    },

    SELFDESTRUCT: (state: State) => {
        const address = state.stack.pop();
        state.halted = true;
        state.stmts.push(new SelfDestruct(address));
    },
};

export const INVALID = (opcode: Opcode, state: State) => {
    state.halted = true;
    state.stmts.push(new Invalid(opcode.opcode));
};
