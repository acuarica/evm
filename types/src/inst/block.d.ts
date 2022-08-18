import { Operand } from '../evm';
export declare class BlockHash {
    readonly blockNumber: Operand;
    readonly name = "BLOCKHASH";
    readonly wrapped = true;
    constructor(blockNumber: Operand);
    toString: () => string;
}
export declare class BlockNumber {
    readonly name = "NUMBER";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
