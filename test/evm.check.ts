import { expect } from 'chai';
import { EVM } from '../src/evm';
import { toHex } from '../src/opcode';
import { fnselector } from './utils/selector';
import { compile } from './utils/solc';
import { keccak_256 } from '@noble/hashes/sha3';

describe('evm', () => {
    it('`PUSH4` method selector to invoke external contract', function () {
        const sig = 'balanceOf(uint256)';
        const sol = `
        interface IERC20 {
            function ${sig} external view returns (uint256);
        }

        contract C {
            fallback() external payable {
                IERC20 addr = IERC20 (0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
                addr.balanceOf(7);
            }
        }`;
        const opcodes = new EVM(compile(sol, '0.7.6', { context: this }).bytecode).opcodes;

        const selector = fnselector(sig);
        const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && toHex(o.pushData) === selector);
        expect(push4, `PUSH4 ${selector} not found`).to.be.not.undefined;
    });

    it('`keccak_256` hash selector for `supportsInterface(bytes4)`', function () {
        const sig = 'supportsInterface(bytes4)';
        const hash = Buffer.from(keccak_256(sig).slice(0, 4)).toString('hex');
        expect(hash).to.be.equal('01ffc9a7');
    });
});
