import { expect } from 'chai';
import { CallDataLoad } from '../../src/inst/info';
import { Shr } from '../../src/inst/logic';
import { Div } from '../../src/inst/math';
import EVM, { Sym } from '../utils/evmtest';

describe('EQ', () => {
    it('should calculate `1 == 1`', () => {
        const evm = new EVM('0x14');
        evm.stack.push(1n);
        evm.stack.push(1n);
        expect(evm.stack.values).to.deep.equal([1n, 1n]);
        evm.parse();
        expect(evm.stack.values).to.deep.equal([1n]);
    });

    it('should calculate `1 == 2`', () => {
        const evm = new EVM('0x14');
        evm.stack.push(1n);
        evm.stack.push(2n);
        expect(evm.stack.values).to.be.deep.equal([2n, 1n]);
        evm.parse();
        expect(evm.stack.values).to.be.deep.equal([0n]);
    });

    it('should stringify `x == 1`', () => {
        const evm = new EVM('0x14');
        evm.stack.push(1n);
        evm.stack.push(new Sym());
        expect(evm.stack.values).to.be.deep.equal([new Sym(), 1n]);
        evm.parse();
        expect(evm.stack.values).has.length(1);
        expect(evm.stack.values[0].toString()).to.be.equal('x == 1');
    });

    ['06fdde03', '12345678', '00000001'].forEach(hash => {
        describe(`EQ detect msg.sig for hash ${hash}`, () => {
            it('should stringify signature `msg.sig` from RHS DIV&EXP', () => {
                const evm = new EVM('0x14');
                evm.stack.push(new Div(new CallDataLoad(0n), 2n ** 0xe0n));
                evm.stack.push(BigInt('0x' + hash));
                evm.parse();

                expect(evm.stack.values).has.length(1);
                expect(evm.stack.values[0].toString()).to.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS DIV&EXP', () => {
                const evm = new EVM('0x14');
                evm.stack.push(BigInt('0x' + hash));
                evm.stack.push(new Div(new CallDataLoad(0n), 2n ** 0xe0n));
                evm.parse();

                expect(evm.stack.values).has.length(1);
                expect(evm.stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from RHS SHR', () => {
                const evm = new EVM('0x14');
                evm.stack.push(new Shr(new CallDataLoad(0n), 0xe0n));
                evm.stack.push(BigInt('0x' + hash));
                evm.parse();

                expect(evm.stack.values).has.length(1);
                expect(evm.stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS SHR', () => {
                const evm = new EVM('0x14');
                evm.stack.push(BigInt('0x' + hash));
                evm.stack.push(new Shr(new CallDataLoad(0n), 0xe0n));
                evm.parse();

                expect(evm.stack.values).has.length(1);
                expect(evm.stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });
        });
    });
});
