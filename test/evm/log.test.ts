import assert = require('assert');
import { expect } from 'chai';
import { EventFragment, Interface } from 'ethers/lib/utils';
import { type Expr, type Stmt, Val } from '../../src/evm/ast';
import { State } from '../../src/state';
import { EVM } from '../utils/evm';
import { compile } from '../utils/solc';

describe('evm::log', () => {
    const knownEventSig = 'Deposit(uint256)';
    const unknownEventSig = 'UnknownEvent(uint256, uint256, uint256)';
    const sol = `contract C {
        event ${knownEventSig};
        event ${unknownEventSig};
        fallback() external payable {
            emit Deposit(1);
            emit UnknownEvent(2, 3, 4);
        }
    }`;

    let evm: ReturnType<typeof EVM>;

    before(function () {
        evm = EVM(compile(sol, '0.7.6', { context: this }).deployedBytecode);
    });

    it('should get it from compiled code', () => {
        const state = new State<Stmt, Expr>();
        evm.exec(0, state);

        {
            const stmt = state.stmts[0];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([new Val(1n)]);
            expect(`${stmt}`).to.be.deep.equal(`emit Deposit(0x1);`);
        }

        {
            const stmt = state.stmts[1];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([new Val(2n), new Val(3n), new Val(4n)]);

            const topic = Interface.getEventTopic(EventFragment.from(unknownEventSig)).substring(2);
            expect(`${stmt}`).to.be.deep.equal(`log(0x${topic}, 0x2, 0x3, 0x4);`);
        }
    });
});
