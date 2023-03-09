import { expect } from 'chai';
import { readFileSync } from 'fs';
import { toHex } from '../../src';
import EVM from '../utils/evmtest';

describe('examples', () => {
    {
        const name = 'DAI-0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';

        describe(`for ${name}`, () => {
            let evm: EVM;

            before(() => {
                const bytecode = readFileSync(`./test/examples/${name}.bytecode`, 'utf8');
                evm = new EVM(bytecode);
            });

            it('There is a `PUSH4` for `canCall(...)` but to call another contract', () => {
                const canCallSelector = 'b7009613';

                expect(
                    evm.opcodes.find(
                        opcode =>
                            opcode.mnemonic === 'PUSH4' &&
                            toHex(opcode.pushData) === canCallSelector
                    )
                ).to.be.not.undefined;
                expect(evm.functionHashes[canCallSelector]).to.be.equal(
                    'canCall(address,address,bytes4)'
                );
                expect(evm.contract.getFunction(canCallSelector)).to.be.undefined;
            });
        });
    }
});
