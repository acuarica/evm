import { expect } from 'chai';
import { readFileSync } from 'fs';

import { Contract } from 'sevm';
import type { Lookup } from 'sevm/4byte';
import { compile } from './utils/solc';
import 'sevm/4byte';

const ENABLE_4BYTE_TEST = process.env['ENABLE_4BYTE_TEST'];
const hint = !ENABLE_4BYTE_TEST ? ' (enable it by setting `ENABLE_4BYTE_TEST`)' : '';

describe(`::4byte ENABLE_4BYTE_TEST=${ENABLE_4BYTE_TEST}${hint}`, function () {

    // Increase timeout to support Node 22 on Windows in CI.
    this.timeout(5000);

    before(function () {
        if (!ENABLE_4BYTE_TEST) this.skip();
    });

    it('should fetch function signatures', async function () {
        const name = 'USDC-0x5425890298aed601595a70AB815c96711a31Bc65';
        const { bytecode } = JSON.parse(readFileSync(`./test/mainnet/${name}.json`, 'utf-8')) as { bytecode: string };

        let contract = new Contract(bytecode);
        let selectors = Object.entries(contract.functions).map(([s, f]) => [s, f.label]);
        expect(selectors).to.be.deep.equal([
            ['5c60da1b', undefined],
            ['8f283970', undefined],
            ['f851a440', undefined],
            ['3659cfe6', undefined],
            ['4f1ef286', undefined]
        ]);

        const lookup: Partial<Lookup> = {};
        contract = await contract.patch(lookup);

        expect(lookup).to.be.deep.equal({
            function: {
                '0x08c379a0': ['Error(string)'],
                '0x3659cfe6': ['upgradeTo(address)'],
                '0x4f1ef286': ['upgradeToAndCall(address,bytes)'],
                '0x5c60da1b': ['implementation()'],
                '0x8f283970': ['changeAdmin(address)'],
                '0xf851a440': ['admin()']
            },
            event: {
                '0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f': ['AdminChanged(address,address)'],
                '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b': ['Upgraded(address)']
            }
        });

        selectors = Object.entries(contract.functions).map(([s, f]) => [s, f.label]);
        expect(selectors).to.be.deep.equal([
            ['5c60da1b', 'implementation()'],
            ['8f283970', 'changeAdmin(address)'],
            ['f851a440', 'admin()'],
            ['3659cfe6', 'upgradeTo(address)'],
            ['4f1ef286', 'upgradeToAndCall(address,bytes)']
        ]);
    });

    it('should fetch function signatures partially', async function () {
        const src = `contract Test {
            function balanceOf(address) external pure returns (uint256) {
                return 1;
            }
            function _thisShouldNotBeInTheLookup_801145594(address) external pure returns (uint256) {
            }
        }`;

        const contract = new Contract(compile(src, '0.7.6', this).bytecode);
        const lookup: Partial<Lookup> = {};
        await contract.patch(lookup);

        const selectors = Object.entries(contract.functions).map(([s, f]) => [s, f.label]);
        expect(selectors).to.be.deep.equal([
            ['70a08231', 'balanceOf(address)'],
            ['fb210caa', undefined],
        ]);
    });

    it('should not fail when there are no functions nor events to patch', async function () {
        const contract = new Contract('0x00');
        await contract.patch();
    });

    it('should perform signature lookup even when lookup object is partially filled', async function () {
        const contract = new Contract('0x00');
        const lookup: Partial<Lookup> = { function: { '0x1': [] } };
        await contract.patch(lookup);
        expect(lookup).to.be.deep.equal({
            function: {},
            event: {},
        });
    });

    it('should fail when there is an invalid response', async function () {
        const _fetch = globalThis.fetch;

        try {
            globalThis.fetch = function (_input) {
                return Promise.resolve({ ok: false });
            } as typeof fetch;

            const contract = new Contract('0x00');
            try {
                await contract.patch();
                expect.fail('Expected to fail');
            } catch (err) {
                expect(err).to.be.deep.equal(
                    new Error('Failed to fetch signatures from api.openchain.xyz, url: https://api.openchain.xyz/signature-database/v1/lookup?function=&event=')
                );
            }
        } finally {
            globalThis.fetch = _fetch;
        }
    });
});
