import assert = require('assert');
import { expect } from 'chai';
import { EVM } from '../../src/evm';
import { type Expr, type Stmt, Val } from '../../src/evm/expr';
import { State } from '../../src/state';
import { eventSelector, eventSelectors } from '../utils/selector';
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

    let evm: EVM;

    before(function () {
        evm = EVM.from(compile(sol, '0.7.6', { context: this }).bytecode);
    });

    it.skip('should get it from compiled code', () => {
        const state = new State<Stmt, Expr>();
        evm.exec(0, state);
        eventSelectors(evm);

        expect(evm.events).to.have.keys(
            eventSelector(knownEventSig),
            eventSelector(unknownEventSig)
        );
        expect(evm.events[eventSelector(knownEventSig)]).to.be.deep.equal({
            sig: knownEventSig,
            indexedCount: 0,
        });

        {
            const stmt = state.stmts[0];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([new Val(1n)]);
            expect(stmt.eventName).to.be.deep.equal('Deposit');
            expect(`${stmt}`).to.be.deep.equal(`emit Deposit(0x1);`);
        }

        {
            const stmt = state.stmts[1];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([new Val(2n), new Val(3n), new Val(4n)]);

            const topic = eventSelector(unknownEventSig);
            expect(`${stmt}`).to.be.deep.equal(`log(0x${topic}, 0x2, 0x3, 0x4);`);
        }
    });
});
