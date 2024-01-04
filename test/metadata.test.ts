import { expect } from 'chai';

import { splitMetadataHash } from 'sevm';

import { compile } from './utils/solc';

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
});
