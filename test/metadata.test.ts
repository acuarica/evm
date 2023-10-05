import { expect } from 'chai';

import { Metadata, stripMetadataHash } from 'sevm';

import { forVersion } from './utils/solc';

describe('metadata', function () {
    it(`should return original bytecode when no metadata`, function () {
        const originalCode = '01020304';
        const [code, metadata] = stripMetadataHash(originalCode);

        expect(code).to.be.equal(originalCode);
        expect(metadata).to.be.undefined;
    });

    const HASHES = {
        '0.5.5': [
            'bzzr',
            'c81d1e127b6ca0e81697eb851bb9788832691c0884dbf0d63c01558ab2b46cba',
            '<0.5.9',
        ],
        '0.5.17': ['bzzr', '67b389a47e87003a2d242f84839b8cd6fa6e69172703b3dd6f1f4aee27324e4a'],
        '0.6.12': ['ipfs', '122006087ea86c8b3d38c23f3d42f78d448db46feb342f2f3210c9d7cf882903da0f'],
        '0.7.6': ['ipfs', '12208354e669af375d574e2cfa78c5eb0ddc3a1fed8b12c2152e131ee5dd4aee7c34'],
        '0.8.16': ['ipfs', '12202ab104c0a9d46b10aa1dfa3aeb3df1e911396f6855ff98940e1724eb477a459f'],
    } as const;

    forVersion((compile, _fallback, version) => {
        let output: ReturnType<typeof compile>;

        before(function () {
            output = compile('contract C {}', this);
        });

        it('should get metadata for deployed bytecode', function () {
            const [, metadata] = stripMetadataHash(output.bytecode);

            const [protocol, hash, expectedVersion] = HASHES[version];
            expect(metadata).to.be.deep.equal(
                new Metadata(protocol, hash, expectedVersion ?? version)
            );
            expect(metadata?.url).to.be.equal(`${protocol}://${hash}`);
        });
    });
});
