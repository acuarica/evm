import { expect } from 'chai';

import { Contract, Shanghai } from 'sevm';
import { Revert, Val } from 'sevm/ast';

import { contracts } from '../utils/solc';

contracts('empty', (compile, fallback, version) => {
    let contract: Contract;

    // eslint-disable-next-line mocha/no-top-level-hooks
    before(function () {
        const src = 'contract Empty { }';
        contract = new Contract(compile(src, this).bytecode);
    });

    it(`should get metadata hash for minimal contract definition`, function () {
        const HASHES = {
            '0.5.5': ['bzzr0', '61cfa0b8ea656ddbb7d387a8cd4fa87e694ed85d11c93d3f00964aa99fd2ef54'],
            '0.5.17': ['bzzr1', '9e364c1993091e0e8fd8895ef98d43bd325053b76e18433d879d3be18085a210'],
            '0.6.12': ['ipfs', 'QmbHEL45gDehV886FXqUJ5JFvWWZ2ZzFz75JEANWPBN9gq'],
            '0.7.6': ['ipfs', 'Qmf1g3GNsgpLdGx4TVkQPZBpBNARw4GDtR2i5QGXQSWixu'],
            '0.8.16': ['ipfs', 'QmQ5UGtrYrGDU9btfXYzuy1dZNQKQy7duqeLxbYfyunosc'],
            '0.8.21': ['ipfs', 'QmNSLs8r9KjVRzEoddMkRhASQCPvUd9BnEuUpUgH7aqC5f'],
        } as const;

        expect(contract.metadata).to.be.not.undefined;

        const hash = HASHES[version];
        expect(contract.metadata!.protocol).to.be.equal(hash[0]);
        expect(contract.metadata!.solc).to.be.equal(version === '0.5.5' ? '' : version);

        expect(contract.metadata!.hash).to.be.equal(hash[1]);
        expect(contract.metadata!.url).to.be.equal(`${hash[0]}://${hash[1]}`);
    });

    it('should not have functions nor events', function () {
        expect(contract.functions).to.be.empty;
        expect(contract.functionBranches).to.be.empty;
        expect(contract.events).to.be.empty;
    });

    it('should have 1 block & 1 `revert`', function () {
        expect(contract.blocks).to.be.of.length(1);

        const block = contract.blocks.get(0)!;

        expect(contract.bytecode[block.pcend - 1]).to.be.equal(new Shanghai().opcodes().REVERT);

        expect(block.states).to.be.of.length(1);
        const [, state] = block.states[0]!;
        expect(state.last?.eval())
            .to.be.deep.equal(new Revert(new Val(0n, true), new Val(0n, true), []));

        expect(contract.main.length).to.be.at.least(1);
        expect(contract.main.at(-1)?.eval()).to.be.deep.equal(
            new Revert(new Val(0n, true), new Val(0n, true), [])
        );
    });

    it('should `decompile` bytecode', function () {
        const text = contract.solidify({ license: null, pragma: false, contractName: 'Empty' });
        expect(text).to.be.equal(`contract Empty {

    ${fallback}() external payable {
        revert();
    }

}
`);
    });
});
