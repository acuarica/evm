export declare class Transaction {
    blockHash?: string;
    blockNumber?: number;
    from?: string;
    gas?: number;
    gasPrice?: number;
    input?: string;
    to?: string;
    value?: number;
    constructor(transactionObject?: any);
    setInput(input: string): void;
    getFunctionHash(): string | false;
    getFunction(functionHashes: {
        [s: string]: string;
    }): string | false;
    getFunctionName(functionHashes: {
        [s: string]: string;
    }): string | false;
    getRawArguments(): string[];
    getArguments(functionHashes: {
        [s: string]: string;
    }, descriptive?: boolean): string[];
    isContractCreation(): boolean;
}
