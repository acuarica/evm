import { expect } from 'chai';

import { EVM, London, Shanghai, State } from 'sevm';
import type { Expr, Inst, Log } from 'sevm/ast';
import { Props, Stop } from 'sevm/ast';

import { type Version, compile } from '../utils/solc';

describe('evm::special', function () {

    for (const prop of Object.values(Props)) {
        it(`should get \`${prop.symbol}\` from compiled code`, function () {
            const src = `contract Test {
                        event Deposit(${prop.type});
                        fallback() external payable {
                            ${['codesize()', 'returndatasize()'].includes(prop.symbol)
                    ? `uint256 value; assembly { value := ${prop.symbol} } emit Deposit(value);`
                    : `emit Deposit(${prop.symbol});`}
                        }
                    }`;

            const bytecode = (version: Version) => compile(src, version, this, { optimizer: { enabled: true } }).bytecode;
            const evm = prop.symbol === 'block.difficulty'
                ? new EVM(bytecode('0.8.16'), London())
                : new EVM(bytecode('0.8.21'), Shanghai());
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(state.stmts.at(-1)).to.be.deep.equal(new Stop());

            const stmt = state.stmts.at(-2)!;
            expect(stmt.name).to.be.equal('Log');
            expect((stmt as Log).args![0].eval()).to.be.deep.equal(prop);
        });
    }
});
