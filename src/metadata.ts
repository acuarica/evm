const BZZR0 = '627a7a7230';
const BZZR1 = '627a7a7231';
const IPFS = '69706673';

const SOLC = '736f6c63';

const protocols: [RegExp, 'bzzr' | 'ipfs'][] = [
    /**
     * https://docs.soliditylang.org/en/v0.5.5/metadata.html
     */
    [new RegExp(`a165${BZZR0}5820([a-f0-9]{64})0029$`), 'bzzr'],

    /**
     * https://docs.soliditylang.org/en/v0.5.17/metadata.html
     */
    [new RegExp(`a265${BZZR1}5820([a-f0-9]{64})64${SOLC}43([a-f0-9]{6})0032$`), 'bzzr'],

    /**
     * https://docs.soliditylang.org/en/v0.8.16/metadata.html
     */
    [new RegExp(`a264${IPFS}5822([a-f0-9]{68})64${SOLC}43([a-f0-9]{6})0033$`), 'ipfs'],
];

/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 */
export class Metadata {
    constructor(readonly protocol: 'bzzr' | 'ipfs', readonly hash: string, readonly solc: string) {}

    get url() {
        return `${this.protocol}://${this.hash}`;
    }
}

/**
 * Splits the `bytecode` into executable code and embedded metadata hash as
 * placed by the Solidity compiler, if present in the `bytecode`.
 *
 * @param bytecode the contract `bytecode` to test for metadata hash from, hex encoded.
 * @returns An tuple where the first component is the executable code and
 * second one is the metadata hash when the metadata is present.
 * Otherwise, the original `bytecode` and `null` respectively.
 */
export function stripMetadataHash(bytecode: string): [string, Metadata | null] {
    for (const [re, protocol] of protocols) {
        const match = bytecode.match(re);
        if (match && match[1]) {
            return [
                bytecode.substring(0, match.index),
                new Metadata(protocol, match[1], match[2] ? convertVersion(match[2]) : '0.5.5'),
            ];
        }
    }

    return [bytecode, null];

    /**
     *
     * @param solcVersion
     * @returns
     */
    function convertVersion(solcVersion: string) {
        const slice = (pos: number) => parseInt(solcVersion.slice(pos, pos + 2), 16).toString();
        return `${slice(0)}.${slice(2)}.${slice(4)}`;
    }
}
