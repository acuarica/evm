import { expect } from 'chai';

import { FunctionFragment } from 'ethers/lib/utils';
import { compile } from './utils/solc';

describe('abi', function () {
    it('should accept tuples', function () {
        const sig = 'someFunc((uint256,uint256)[])';
        const func = FunctionFragment.from(sig);
        expect(func.format()).to.be.equal(sig);
    });

    it('should accept params with `uint/int`', function () {
        const sig = 'someFunc(uint,int)';
        const func = FunctionFragment.from(sig);
        expect(func.format()).to.be.equal('someFunc(uint256,int256)');
    });

    it('encode tuples types in public parameters', function () {
        // https://docs.soliditylang.org/en/develop/abi-spec.html#handling-tuple-types
        const sol = `contract C {
            struct S { uint a; uint[] b; T[] c; }
            struct T { uint x; uint y; }
            function f(S memory, T memory, uint) public pure {}
        }`;
        const abi = compile(sol, '0.8.16', { context: this, severity: 'info' }).abi;
        expect(FunctionFragment.from(abi[0]).format()).to.be.equal(
            'f((uint256,uint256[],(uint256,uint256)[]),(uint256,uint256),uint256)'
        );
    });
});
