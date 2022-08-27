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
 *
 * @param code
 * @returns
 */
export function stripMetadataHash(code: string): [string, MetadataHash | null] {
    for (const [re, protocol] of protocols) {
        const match = code.match(re);
        if (match && match[1]) {
            return [code.substring(0, match.index), `${protocol}://${match[1]}`];
        }
    }

    return [code, null];
}
