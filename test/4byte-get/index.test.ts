import { expect } from 'chai';
import { readFileSync } from 'fs';

import { Contract } from 'sevm';

const ENABLE_4BYTE_GET_TEST = process.env['ENABLE_4BYTE_GET_TEST'];

describe(`::4byte-get ENABLE_4BYTE_GET_TEST=${ENABLE_4BYTE_GET_TEST}`, function () {

    const title = !ENABLE_4BYTE_GET_TEST ? ' (enable it by setting `ENABLE_4BYTE_GET_TEST`)' : '';

    it(`should fetch function signatures${title}`, async function () {
        if (!ENABLE_4BYTE_GET_TEST) {
            this.skip();
        }

        // Use dynamic import to avoid failing when test disabled and `fetch` is not defined.
        await import('sevm/4byte-get');

        const name = 'USDC-0x5425890298aed601595a70AB815c96711a31Bc65';
        const bytecode = readFileSync(`./test/examples/${name}.bytecode`, 'utf8');

        let contract = new Contract(bytecode);
        let selectors = Object.entries(contract.functions).map(([s, f]) => [s, f.label]);
        expect(selectors).to.be.deep.equal([
            ['5c60da1b', undefined],
            ['8f283970', undefined],
            ['f851a440', undefined],
            ['3659cfe6', undefined],
            ['4f1ef286', undefined]
        ]);

        contract = await contract.patchf();

        selectors = Object.entries(contract.functions).map(([s, f]) => [s, f.label]);
        expect(selectors).to.be.deep.equal([
            ['5c60da1b', 'implementation()'],
            ['8f283970', 'changeAdmin(address)'],
            ['f851a440', 'admin()'],
            ['3659cfe6', 'upgradeTo(address)'],
            ['4f1ef286', 'upgradeToAndCall(address,bytes)']
        ]);
    });
});
