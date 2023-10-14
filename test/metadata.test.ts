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
            '5d2a7f7236dd33784730b31e6c9e23b977b5c78b67e6f3ae1e476d4bad674583',
            '<0.5.9',
        ],
        '0.5.17': ['bzzr', 'bc000e08756c8a39ecf14e345b9b9cd73096befd4310ba9be5acd60f965e9117'],
        '0.6.12': ['ipfs', '122022dc709c3afc7cabde0eb1cb8305f420c0cee343e32fef5905ba12a6c80275cc'],
        '0.7.6': ['ipfs', '122097825c4aec6dd5baee935bb6c6efdfef43e6eccaf6e57b3c9776f4dc1fc98796'],
        '0.8.16': ['ipfs', '1220d4c87f86f0fbd16c75f71f84f3fbae12b409812214fc9572eb31de27b071e944'],
    } as const;

    forVersion((compile, _fallback, version) => {
        let output: ReturnType<typeof compile>;

        before(function () {
            output = compile('contract Test {}', this);
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
