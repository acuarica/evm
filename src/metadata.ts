const BZZR0 = '627a7a7230';
const BZZR1 = '627a7a7231';
const SOLC = '736f6c63';
const IPFS = '69706673';

/**
 * https://docs.soliditylang.org/en/v0.5.5/metadata.html
 */
const METADATA_SOLC_0_5_5 = new RegExp(`a165${BZZR0}5820([a-f0-9]{64})0029$`);

/**
 * https://docs.soliditylang.org/en/v0.5.17/metadata.html
 */
const METADATA_SOLC_0_5_17 = new RegExp(
    `a265${BZZR1}5820([a-f0-9]{64})64${SOLC}43([a-f0-9]{6})0032$`
);

/**
 * https://docs.soliditylang.org/en/v0.8.16/metadata.html
 */
const METADATA_SOLC_0_8_16 = new RegExp(
    `a264${IPFS}5822([a-f0-9]{68})64${SOLC}43([a-f0-9]{6})0033$`
);

const protocols: [RegExp, 'bzzr' | 'ipfs'][] = [
    [METADATA_SOLC_0_5_5, 'bzzr'],
    [METADATA_SOLC_0_5_17, 'bzzr'],
    [METADATA_SOLC_0_8_16, 'ipfs'],
];

/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 */
export type MetadataHash = `bzzr://${string}` | `ipfs://${string}`;

/**
 * Splits the `bytecode` into executable code and embedded metadata hash as
 * placed by the Solidity compiler.
 *
 * @param bytecode the contract `bytecode` to test for metadata hash from.
 * @returns An tuple where the first component is the executable code and
 * second one is the metadata hash when the metadata is present.
 * Otherwise, the original `bytecode` and `null` respectively.
 */
export function stripMetadataHash(bytecode: string): [string, MetadataHash | null] {
    for (const [re, protocol] of protocols) {
        const match = bytecode.match(re);
        if (match && match[1]) {
            return [bytecode.substring(0, match.index), `${protocol}://${match[1]}`];
        }
    }

    return [bytecode, null];
}
