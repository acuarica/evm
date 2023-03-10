import { expect } from 'chai';
import { Add, exec, isVal, isZero, Mul, Sub, Val } from '../src/expr';

describe('expr::', () => {
    it('should test `isVal`', () => {
        expect(isVal(Val(0n))).to.be.true;
        expect(isVal(Add(Val(1n), Val(2n)))).to.be.false;
    });

    it('should test `isZero`', () => {
        expect(isZero(Val(0n))).to.be.true;
        expect(isZero(Val(1n))).to.be.false;
    });

    it('should `eval` `Val` & `Add`', () => {
        expect(exec(Add(Val(2n), Val(3n)))).to.be.deep.equal(Val(5n));
    });

    it('should `eval` `Add` & `Mul`', () => {
        expect(exec(Mul(Val(2n), Add(Val(4n), Val(3n))))).to.be.deep.equal(Val(14n));
    });

    it('should `eval` `Sub` & `Add`', () => {
        expect(exec(Sub(Val(7n), Add(Val(4n), Val(3n))))).to.be.deep.equal(Val(0n));
    });
});
