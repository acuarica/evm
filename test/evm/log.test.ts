import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State, solEvents, solStmts, yulStmts } from 'sevm';
import { Val, type Expr, type Inst, type Local } from 'sevm/ast';

import { eventSelector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::log', function () {
    it('should decompile known and unknown events with locals', function () {
        const knownEventSig = 'Deposit(uint256)';
        const unknownEventSig = 'UnknownEvent(uint256, uint256, uint256)';
        const src = `contract Test {
            event ${knownEventSig};
            event ${unknownEventSig};
            fallback() external payable {
                emit Deposit(1);
                emit UnknownEvent(2, 3, 4);
                uint256 n = block.number;
                emit Deposit(n);
                emit Deposit(n + 7);
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);

        const state = new State<Inst, Expr>();
        evm.exec(0, state);
        const ev = knownEventSig;
        evm.events[eventSelector(ev)].sig = ev;

        expect(evm.events).to.have.keys(
            eventSelector(knownEventSig),
            eventSelector(unknownEventSig)
        );
        expect(evm.events[eventSelector(knownEventSig)]).to.be.deep.equal({
            sig: knownEventSig,
            indexedCount: 0,
        });

        expect(solEvents(evm.events)).to.be.equal(`event Deposit(uint256 _arg0);
event ${eventSelector(unknownEventSig)};
`);

        const stmts = state.stmts.filter(stmt => stmt.name === 'Log');

        assert(stmts[0].name === 'Log');
        assert(stmts[0].args![0].tag === 'Local');
        expect(stmts[0].args![0].value).to.be.deep.equal(new Val(1n, true));
        expect(stmts[0].eventName).to.be.deep.equal('Deposit');

        assert(stmts[1].name === 'Log');
        assert(stmts[1].args?.every((e): e is Local => e.tag === 'Local'));
        expect(stmts[1].args?.map(e => e.value)).to.be.deep.equal([
            new Val(2n, true),
            new Val(3n, true),
            new Val(4n, true),
        ]);

        const topic = eventSelector(unknownEventSig);
        const local = 'local10';
        expect(solStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
            'emit Deposit(0x1);',
            `log(0x${topic}, 0x2, 0x3, 0x4);`,
            `uint ${local} = block.number; // #refs 1`,
            `emit Deposit(${local});`,
            `emit Deposit(${local} + 0x7);`,
            'return;',
        ]);
        expect(yulStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
            'mstore(0x40, 0x80)',
            'mstore(0x80, 0x1)',
            'log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)',
            'mstore(0x80, 0x2)',
            'mstore(add(0x20, 0x80), 0x3)',
            'mstore(add(0x20, add(0x20, 0x80)), 0x4)',
            `log1(0x80, sub(add(0x20, add(0x20, add(0x20, 0x80))), 0x80), 0x${topic})`,
            `uint ${local} = block.number // #refs 1`,
            `mstore(0x80, ${local})`,
            `log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)`,
            `mstore(0x80, add(${local}, 0x7))`,
            `log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)`,
            'stop()',
        ]);
    });
});
