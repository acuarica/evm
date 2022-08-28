import { Operand } from '../evm';
import { hex2a } from '../hex';
import stringify from '../utils/stringify';

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
