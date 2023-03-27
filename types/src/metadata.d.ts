/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 */
export declare class Metadata {
    readonly protocol: 'bzzr' | 'ipfs';
    readonly hash: string;
    readonly solc: string;
    constructor(protocol: 'bzzr' | 'ipfs', hash: string, solc: string);
    get url(): string;
}
/**
 * Splits the `bytecode` into executable code and embedded metadata hash as
 * placed by the Solidity compiler, if present in the `bytecode`.
 *
 * @param bytecode the contract `bytecode` to test for metadata hash from, hex encoded.
 * @returns An tuple where the first component is the executable code and
 * second one is the metadata hash when the metadata is present.
 * Otherwise, the original `bytecode` and `undefined` respectively.
 */
export declare function stripMetadataHash(bytecode: string): [string, Metadata | undefined];
