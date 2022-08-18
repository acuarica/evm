export declare class Revert {
    readonly name = "REVERT";
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;
    constructor(items: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
