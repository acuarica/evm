export interface Opcode {
    pc: number;
    opcode: number;
    name: string;
    pushData?: Uint8Array;
}
