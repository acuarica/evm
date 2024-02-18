import { expect } from 'chai';

import { splitMetadataHash } from 'sevm';

import { compile } from './utils/solc';

/**
 * Imported from https://github.com/cbor/test-vectors
 * 
 * ### test-vectors
 * 
 * This repo collects some simple test vectors in machine-processable form.
 * 
 * #### `appendix_a.json`
 * 
 * All examples in Appendix A of RFC 7049, encoded as a JSON array.
 * 
 * Each element of the test vector is a map (JSON object) with the keys:
 * 
 * - ~`cbor`: a base-64 encoded CBOR data item~ **_removed_ use `hex` encoding**
 * - `hex`: the same CBOR data item in hex encoding
 * - `roundtrip`: a boolean that indicates whether a generic CBOR encoder would typically produce identical CBOR on re-encoding the decoded data item (your mileage may vary)
 * - `decoded`: the decoded data item if it can be represented in JSON
 * - `diagnostic`: the representation of the data item in CBOR diagnostic notation, otherwise
 * 
 * To make use of the cases that need diagnostic notation,
 * a diagnostic notation printer is usually all that is needed:
 * decode the CBOR, print the decoded data item in diagnostic notation, and compare.
 * 
 * (Note that the diagnostic notation uses full decoration for the indefinite length byte string,
 * while the decoded indefinite length text string represented in JSON necessarily doesn't.)
 */
const appendix_a: { hex: string, roundtrip: boolean, decoded?: unknown, diagnostic?: string }[] = [
    { hex: '00', roundtrip: true, decoded: 0 },
    { hex: '01', roundtrip: true, decoded: 1 },
    { hex: '0a', roundtrip: true, decoded: 10 },
    { hex: '17', roundtrip: true, decoded: 23 },
    { hex: '1818', roundtrip: true, decoded: 24 },
    { hex: '1819', roundtrip: true, decoded: 25 },
    { hex: '1864', roundtrip: true, decoded: 100 },
    { hex: '1903e8', roundtrip: true, decoded: 1000 },
    { hex: '1a000f4240', roundtrip: true, decoded: 1000000 },
    { hex: '1b000000e8d4a51000', roundtrip: true, decoded: 1000000000000 },
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    { hex: '1bffffffffffffffff', roundtrip: true, decoded: 18446744073709551615 },
    { hex: 'c249010000000000000000', roundtrip: true, decoded: 18446744073709551616 },
    { hex: '3bffffffffffffffff', roundtrip: true, decoded: -18446744073709551616 },
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    { hex: 'c349010000000000000000', roundtrip: true, decoded: -18446744073709551617 },
    { hex: '20', roundtrip: true, decoded: -1 },
    { hex: '29', roundtrip: true, decoded: -10 },
    { hex: '3863', roundtrip: true, decoded: -100 },
    { hex: '3903e7', roundtrip: true, decoded: -1000 },
    { hex: 'f90000', roundtrip: true, decoded: 0.0 },
    { hex: 'f98000', roundtrip: true, decoded: -0.0 },
    { hex: 'f93c00', roundtrip: true, decoded: 1.0 },
    { hex: 'fb3ff199999999999a', roundtrip: true, decoded: 1.1 },
    { hex: 'f93e00', roundtrip: true, decoded: 1.5 },
    { hex: 'f97bff', roundtrip: true, decoded: 65504.0 },
    { hex: 'fa47c35000', roundtrip: true, decoded: 100000.0 },
    { hex: 'fa7f7fffff', roundtrip: true, decoded: 3.4028234663852886e+38 },
    { hex: 'fb7e37e43c8800759c', roundtrip: true, decoded: 1.0e+300 },
    { hex: 'f90001', roundtrip: true, decoded: 5.960464477539063e-08 },
    { hex: 'f90400', roundtrip: true, decoded: 6.103515625e-05 },
    { hex: 'f9c400', roundtrip: true, decoded: -4.0 },
    { hex: 'fbc010666666666666', roundtrip: true, decoded: -4.1 },
    { hex: 'f97c00', roundtrip: true, diagnostic: 'Infinity' },
    { hex: 'f97e00', roundtrip: true, diagnostic: 'NaN' },
    { hex: 'f9fc00', roundtrip: true, diagnostic: '-Infinity' },
    { hex: 'fa7f800000', roundtrip: false, diagnostic: 'Infinity' },
    { hex: 'fa7fc00000', roundtrip: false, diagnostic: 'NaN' },
    { hex: 'faff800000', roundtrip: false, diagnostic: '-Infinity' },
    { hex: 'fb7ff0000000000000', roundtrip: false, diagnostic: 'Infinity' },
    { hex: 'fb7ff8000000000000', roundtrip: false, diagnostic: 'NaN' },
    { hex: 'fbfff0000000000000', roundtrip: false, diagnostic: '-Infinity' },
    { hex: 'f4', roundtrip: true, decoded: false },
    { hex: 'f5', roundtrip: true, decoded: true },
    { hex: 'f6', roundtrip: true, decoded: null },
    { hex: 'f7', roundtrip: true, diagnostic: 'undefined' },
    { hex: 'f0', roundtrip: true, diagnostic: 'simple(16)' },
    { hex: 'f818', roundtrip: true, diagnostic: 'simple(24)' },
    { hex: 'f8ff', roundtrip: true, diagnostic: 'simple(255)' },
    { hex: 'c074323031332d30332d32315432303a30343a30305a', roundtrip: true, diagnostic: '0(\'2013-03-21T20:04:00Z\')' },
    { hex: 'c11a514b67b0', roundtrip: true, diagnostic: '1(1363896240)' },
    { hex: 'c1fb41d452d9ec200000', roundtrip: true, diagnostic: '1(1363896240.5)' },
    { hex: 'd74401020304', roundtrip: true, diagnostic: "23(h'01020304')" },
    { hex: 'd818456449455446', roundtrip: true, diagnostic: "24(h'6449455446')" },
    { hex: 'd82076687474703a2f2f7777772e6578616d706c652e636f6d', roundtrip: true, diagnostic: '32(\'http://www.example.com\')' },
    { hex: '40', roundtrip: true, diagnostic: "h''" },
    { hex: '4401020304', roundtrip: true, diagnostic: "h'01020304'" },
    { hex: '60', roundtrip: true, decoded: '' },
    { hex: '6161', roundtrip: true, decoded: 'a' },
    { hex: '6449455446', roundtrip: true, decoded: 'IETF' },
    { hex: '62225c', roundtrip: true, decoded: '\'\\' },
    { hex: '62c3bc', roundtrip: true, decoded: 'ü' },
    { hex: '63e6b0b4', roundtrip: true, decoded: '水' },
    { hex: '64f0908591', roundtrip: true, decoded: '𐅑' },
    { hex: '80', roundtrip: true, decoded: [] },
    { hex: '83010203', roundtrip: true, decoded: [1, 2, 3] },
    { hex: '8301820203820405', roundtrip: true, decoded: [1, [2, 3], [4, 5]] },
    {
        hex: '98190102030405060708090a0b0c0d0e0f101112131415161718181819',
        roundtrip: true,
        decoded: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    },
    { hex: 'a0', roundtrip: true, decoded: {} },
    { hex: 'a201020304', roundtrip: true, diagnostic: '{1: 2, 3: 4}' },
    { hex: 'a26161016162820203', roundtrip: true, decoded: { a: 1, b: [2, 3] } },
    { hex: '826161a161626163', roundtrip: true, decoded: ['a', { b: 'c' }] },
    { hex: 'a56161614161626142616361436164614461656145', roundtrip: true, decoded: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' } },
    { hex: '5f42010243030405ff', roundtrip: false, diagnostic: "(_ h'0102', h'030405')" },
    { hex: '7f657374726561646d696e67ff', roundtrip: false, decoded: 'streaming' },
    { hex: '9fff', roundtrip: false, decoded: [] },
    { hex: '9f018202039f0405ffff', roundtrip: false, decoded: [1, [2, 3], [4, 5]] },
    { hex: '9f01820203820405ff', roundtrip: false, decoded: [1, [2, 3], [4, 5]] },
    { hex: '83018202039f0405ff', roundtrip: false, decoded: [1, [2, 3], [4, 5]] },
    { hex: '83019f0203ff820405', roundtrip: false, decoded: [1, [2, 3], [4, 5]] },
    {
        hex: '9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff',
        roundtrip: false,
        decoded: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    },
    { hex: 'bf61610161629f0203ffff', roundtrip: false, decoded: { a: 1, b: [2, 3] } },
    { hex: '826161bf61626163ff', roundtrip: false, decoded: ['a', { b: 'c' }] },
    { hex: 'bf6346756ef563416d7421ff', roundtrip: false, decoded: { Fun: true, Amt: -2 } }
];

describe('::metadata', function () {
    it('should return original bytecode when metadata is not present', function () {
        const { bytecode, metadata } = splitMetadataHash('01020304');
        expect(bytecode).to.be.deep.equal(new Uint8Array([1, 2, 3, 4]));
        expect(metadata).to.be.undefined;
    });

    it('should return original bytecode when bytecode is not long enough', function () {
        const { bytecode, metadata } = splitMetadataHash('0102');
        expect(bytecode).to.be.deep.equal(new Uint8Array([1, 2]));
        expect(metadata).to.be.undefined;
    });

    it('should return original bytecode when metadata is not an object', function () {
        const { bytecode, metadata } = splitMetadataHash('0x001904D20003');
        expect(bytecode).to.be.deep.equal(new Uint8Array([0, 0x19, 0x04, 0xD2, 0x00, 0x03]));
        expect(metadata).to.be.undefined;
    });

    it('should split metadata when it is an array', function () {
        const { bytecode, metadata } = splitMetadataHash('0x0084010203040005');
        expect(bytecode).to.be.deep.equal(new Uint8Array([0]));
        expect(metadata).to.be.deep.equal({ '0': 1, '1': 2, '2': 3, '3': 4, protocol: '', hash: '', solc: '' });
    });

    it('should decode when `solc` property is found', function () {
        const { metadata } = splitMetadataHash(compile('contract Test {}', '0.8.21', this, {
            metadata: {
                bytecodeHash: 'none'
            }
        }).bytecode);
        expect(metadata).to.be.deep.equal({
            protocol: '',
            hash: '',
            solc: '0.8.21',
        });
    });

    /**
     * IPFS hashes need to be computed manually in order to avoid adding
     * [`ipfs-core`](https://github.com/ipfs/js-ipfs#install-as-an-application-developer)
     * as a dependency.
     * This is a bloated and deprecated package.
     *
     * To get the IPFS hash of each contract define `$ARTIFACT` to the output of `solc` compiler and run
     *
     * ```sh
     * cat $ARTIFACT | jq -r .metadata | tr -d '\n' | ipfs add --quiet --only-hash
     * ```
     */
    const HASHES = [
        ['0.5.5', 'bzzr0', '886590b34f4504f97d0869b9d2210fb027f1057978e99c5a955fd1ea6ab603e9', ''],
        ['0.5.17', 'bzzr1', '99edd4d2083be1b43f60e5f50ceb4ef57a6b968f18f236047a97a0eb54036a99'],
        ['0.6.12', 'ipfs', 'QmR2wMAiGogVWTxtXh1AVNboWSHNggtn9jYzG2zLXi836A'],
        ['0.7.6', 'ipfs', 'QmaRBmmGGny5mjFjSJcbvcQLsJMRsbcSB4QoEcxFu9mxhB'],
        ['0.8.16', 'ipfs', 'QmcshgdTcz3T2rD8BgPAw2njvp2WsCCcsi6qh9VQhJhwLZ'],
        ['0.8.21', 'ipfs', 'QmQaEuFFsAwGbKd51LPcsLkKD5NwsB8aAzg7KkRsjuhjf2'],
    ] as const;

    describe(`should get bytecode's metadata compiled with`, function () {
        HASHES.forEach(([version, protocol, hash, expectedVersion]) => {
            it(`solc-${version}`, function () {
                const { metadata } = splitMetadataHash(compile('contract Test {}', version, this).bytecode);
                expect(metadata).to.be.deep.equal(
                    { protocol, hash, solc: expectedVersion ?? version }
                );
                expect(metadata?.url).to.be.equal(`${protocol}://${hash}`);
            });
        });
    });

    describe('should decode metadata from bytecode (tests from https://github.com/ethereum/sourcify)', function () {
        [
            ['`bzzr1`', '6e677468a2646970667358221220dceca8706b29e917dacf25fceef95acac8d90d765ac926663ce4096195952b6164736f6c634300060b0033', {
                hash: 'QmdD3hpMj6mEFVy9DP4QqjHaoeYbhKsYvApX1YZNfjTVWp',
                protocol: 'ipfs',
                solc: '0.6.11',
            }] as const,
            ['`ipfs`', '0x72657373a265627a7a7231582071e0c183217ae3e9a1406ae7b58c2f36e09f2b16b10e19d46ceb821f3ee6abad64736f6c63430005100032', {
                protocol: 'bzzr1',
                hash: '71e0c183217ae3e9a1406ae7b58c2f36e09f2b16b10e19d46ceb821f3ee6abad',
                solc: '0.5.16',
            }] as const,
            ['`experimental`', '565bfea3646970667358221220bfdd0169ba76579372f6637e9fd849a7cefae9eede22f3fa7031e547a2738ab06c6578706572696d656e74616cf564736f6c634300080a0041', {
                experimental: true,
                protocol: 'ipfs',
                hash: 'QmbFc3AoHDC977j2UH2WwYSwsSRrBGj8bsiiyigXhHzyuZ',
                solc: '0.8.10',
            }] as const,
            ['invalid CBOR data', '46865207a65726f2061646472657373a265627a7a7231582071e0c183217ae3e9a1406ae7b58c2f36e09f2b16b10e19d46ceb821f30032', undefined] as const
        ].forEach(([title, bytecode, metadata]) => {
            it(title, function () {
                expect(splitMetadataHash(bytecode).metadata).to.be.deep.equal(metadata);
            });
        });
    });

    describe('cbor', function () {
        appendix_a.forEach(({ hex, decoded }) => {
            it(`should cbor decode \`${hex}\` into \`${JSON.stringify(decoded)}\``, function () {
                hex = '0x0102' + hex + (hex.length / 2).toString(16).padStart(4, '0');
                const { bytecode, metadata } = splitMetadataHash(hex);

                if (decoded !== null && typeof decoded === 'object') {
                    expect(bytecode).to.be.deep.equal(new Uint8Array([1, 2]));
                    expect(metadata).to.be.deep.equal({ ...decoded, protocol: '', hash: '', solc: '' });
                } else if (metadata === undefined) {
                    expect(bytecode).to.be.deep.equal(Buffer.from(hex.slice(2), 'hex'));
                } else {
                    this.skip();
                }
            });
        });
    });
});
