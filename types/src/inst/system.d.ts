export declare class Invalid {
    readonly opcode: any;
    readonly name = "INVALID";
    readonly type?: string;
    readonly wrapped = true;
    constructor(opcode: any);
    toString: () => string;
}
export declare class SelfDestruct {
    readonly address: any;
    readonly name = "SELFDESTRUCT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(address: any);
    toString: () => string;
}
