import assert = require('assert');
import { expect } from 'chai';
import { EVM } from '../../src/evm';
import { type Expr, type Inst, Val } from '../../src/evm/expr';
import { stringifyEvents } from '../../src/evm/log';
import { State } from '../../src/state';
import { eventSelector } from '../utils/selector';
import { compile } from '../utils/solc';
import { eventSelectors } from '../../src/selector';

describe('evm::log', function () {
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
        evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
    });

    it('should get it from compiled code', function () {
        const state = new State<Inst, Expr>();
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

        expect(stringifyEvents(evm.events)).to.be.equal(`event Deposit(uint256 _arg0);
event ${eventSelector(unknownEventSig)};
`);

        {
            const stmt = state.stmts[0];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([new Val(1n, true)]);
            expect(stmt.eventName).to.be.deep.equal('Deposit');
            expect(`${stmt}`).to.be.deep.equal(`emit Deposit(0x1);`);
        }

        {
            const stmt = state.stmts[1];
            assert(stmt.name === 'Log');
            expect(stmt.args).to.be.deep.equal([
                new Val(2n, true),
                new Val(3n, true),
                new Val(4n, true),
            ]);

            const topic = eventSelector(unknownEventSig);
            expect(`${stmt}`).to.be.deep.equal(`log(0x${topic}, 0x2, 0x3, 0x4);`);
        }
    });
});
