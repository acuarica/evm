import stringify from '../utils/stringify';

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
