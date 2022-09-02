import { hex2a } from '../hex';
import { Opcode } from '../opcode';
import { Operand, State } from '../state';
import { memArgs, stringify } from './utils';

/**
 * https://www.evm.codes/#00
 */
export class Stop {
    readonly name = 'STOP';
    readonly wrapped = false;

    toString = () => 'return;';
}

export class CREATE {
    readonly name = 'CREATE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: any, readonly memoryLength: any, readonly value: any) {
        // this.name = 'address';
    }

    toString() {
        return (
            '(new Contract(memory[' +
            stringify(this.memoryStart) +
            ':(' +
            stringify(this.memoryStart) +
            '+' +
            stringify(this.memoryLength) +
            ')]).value(' +
            stringify(this.value) +
            ')).address'
        );
    }
}

export class CALL {
    readonly name = 'CALL';
    readonly type?: string;
    readonly wrapped = false;
    throwOnFail = false;

    constructor(
        readonly gas: any,
        readonly address: any,
        readonly value: any,
        readonly memoryStart: any,
        readonly memoryLength: any,
        readonly outputStart: any,
        readonly outputLength: any
    ) {}

    toString() {
        if (
            typeof this.memoryLength === 'bigint' &&
            this.memoryLength === 0n &&
            typeof this.outputLength === 'bigint' &&
            this.outputLength === 0n
        ) {
            if (
                this.gas.name === 'MUL' &&
                this.gas.left.name === 'ISZERO' &&
                typeof this.gas.right === 'bigint' &&
                this.gas.right === 2300n
            ) {
                if (this.throwOnFail) {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').transfer(' +
                        stringify(this.value) +
                        ')'
                    );
                } else {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').send(' +
                        stringify(this.value) +
                        ')'
                    );
                }
            } else {
                return (
                    'address(' +
                    stringify(this.address) +
                    ').call.gas(' +
                    stringify(this.gas) +
                    ').value(' +
                    stringify(this.value) +
                    ')'
                );
            }
        } else {
            return (
                'call(' +
                stringify(this.gas) +
                ',' +
                stringify(this.address) +
                ',' +
                stringify(this.value) +
                ',' +
                stringify(this.memoryStart) +
                ',' +
                stringify(this.memoryLength) +
                ',' +
                stringify(this.outputStart) +
                ',' +
                stringify(this.outputLength) +
                ')'
            );
        }
    }
}

export class ReturnData {
    readonly name = 'ReturnData';
    readonly wrapped = false;

    constructor(readonly retOffset: any, readonly retSize: any) {}

    toString() {
        return `output:ReturnData:${this.retOffset}:${this.retSize}`;
    }
}
export class CALLCODE {
    readonly name = 'CALLCODE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly gas: Operand,
        readonly address: Operand,
        readonly value: Operand,
        readonly memoryStart: Operand,
        readonly memoryLength: Operand,
        readonly outputStart: Operand,
        readonly outputLength: Operand
    ) {}

    toString() {
        return (
            'callcode(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.value) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export class CREATE2 {
    readonly name = 'CREATE2';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: any, readonly memoryLength: any, readonly value: any) {}

    toString() {
        return (
            '(new Contract(memory[' +
            stringify(this.memoryStart) +
            ':(' +
            stringify(this.memoryStart) +
            '+' +
            stringify(this.memoryLength) +
            ')]).value(' +
            stringify(this.value) +
            ')).address'
        );
    }
}

export class STATICCALL {
    readonly name = 'STATICCALL';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly gas: Operand,
        readonly address: Operand,
        readonly memoryStart: Operand,
        readonly memoryLength: Operand,
        readonly outputStart: Operand,
        readonly outputLength: Operand
    ) {}

    toString() {
        return (
            'staticcall(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export class DELEGATECALL {
    readonly name = 'DELEGATECALL';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly gas: Operand,
        readonly address: Operand,
        readonly memoryStart: Operand,
        readonly memoryLength: Operand,
        readonly outputStart: Operand,
        readonly outputLength: Operand
    ) {}

    toString() {
        return (
            'delegatecall(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export class Return {
    readonly name = 'RETURN';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: Operand;
    readonly memoryLength?: Operand;

    constructor(readonly items: Operand[], memoryStart?: Operand, memoryLength?: Operand) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        }
    }

    toString(): string {
        if (this.memoryStart && this.memoryLength) {
            return (
                'return memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')];'
            );
        } else if (this.items.length === 0) {
            return 'return;';
        } else if (
            this.items.length === 1 &&
            (typeof this.items[0] === 'bigint' || (this.items[0] as any).static)
        ) {
            return 'return ' + this.items[0] + ';';
        } else if (
            this.items.length === 3 &&
            this.items.every((item: any) => typeof item === 'bigint') &&
            this.items[0] === 32n
        ) {
            return 'return "' + hex2a(this.items[2].toString(16)) + '";';
        } else {
            return this.items.length === 1
                ? `return ${stringify(this.items[0])};`
                : `return (${this.items.map(item => stringify(item)).join(', ')});`;
        }
    }
}

export class Revert {
    readonly name = 'REVERT';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: Operand;
    readonly memoryLength?: Operand;
    readonly items?: Operand[];

    constructor(items: Operand[], memoryStart?: Operand, memoryLength?: Operand) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return 'revert(' + this.items.map(item => stringify(item)).join(', ') + ');';
        } else {
            return `revert(memory[${stringify(this.memoryStart!)}:(${stringify(
                this.memoryStart!
            )}+${stringify(this.memoryLength!)})]);`;
        }
    }
}

export class Invalid {
    readonly name = 'INVALID';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly opcode: any) {}

    toString = () => `revert("Invalid instruction (0x${this.opcode.toString(16)})");`;
}

export class SelfDestruct {
    readonly name = 'SELFDESTRUCT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any) {}

    toString = () => `selfdestruct(${stringify(this.address)});`;
}

export const SYSTEM = {
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
        // const memoryStart = state.stack.pop();
        // const memoryLength = state.stack.pop();
        state.halted = true;
        memArgs(state, Return, state.stmts.push.bind(state.stmts));
        // if (isBigInt(memoryStart) && isBigInt(memoryLength)) {
        //     const items = [];
        //     for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
        //         items.push(i in state.memory ? state.memory[i] : new MLOAD(i));
        //     }
        //     state.stmts.push(new Return(items));
        // } else {
        //     state.stmts.push(new Return([], memoryStart, memoryLength));
        // }
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
        // const memoryStart = state.stack.pop();
        // const memoryLength = state.stack.pop();
        state.halted = true;
        memArgs(state, Revert, state.stmts.push.bind(state.stmts));
        // if (isBigInt(memoryStart) && isBigInt(memoryLength)) {
        //     const items = [];
        //     for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
        //         items.push(i in state.memory ? state.memory[i] : new MLOAD(i));
        //     }
        //     state.stmts.push(new Revert(items));
        // } else {
        //     state.stmts.push(new Revert([], memoryStart, memoryLength));
        // }
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
