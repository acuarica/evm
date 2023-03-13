import { expect } from 'chai';
import type { Expr } from '../../src/evm/ast';
import { INFO, SYM, Symbol0 } from '../../src/evm/sym';
import { State } from '../../src/state';

describe('evm::sym::', () => {
    for (const [name, value] of Object.entries(INFO)) {
        it(`should get \`${value}\` when executing \`${name}\``, () => {
            const state = new State<never, Expr>();
            SYM[name as keyof typeof INFO](state);
            expect(state.stack.values).to.be.deep.equal([new Symbol0(value)]);
        });
    }
});
