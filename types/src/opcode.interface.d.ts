/// <reference types="node" />
export interface Opcode {
    pc: number;
    opcode: number;
    name: string;
    pushData?: Buffer;
}
