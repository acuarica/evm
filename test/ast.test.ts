import { expect } from 'chai';
import { Add, Mul, Sub, Val } from '../src/ast';

describe('ast', () => {
    it('should create an instance', () => {
        expect(
            new Add(new Val(5n), new Sub(new Val(4n), new Mul(new Val(2n), new Val(3n)))).toString()
        ).to.be.equal('5 + (4 - (2 * 3))');
    });
});
