import { expect } from 'chai';
import { EVM } from '../../src/evm';
import { type Expr, type Inst, Val } from '../../src/evm/expr';
import { Add, Sub } from '../../src/evm/math';
import { MappingLoad, MappingStore, STORAGE } from '../../src/evm/storage';
import { Symbol0 } from '../../src/evm/sym';
import { Stop } from '../../src/evm/system';
import { State } from '../../src/state';
import { compile } from '../utils/solc';

describe('evm::storage', () => {
    it('should store variable', function () {
        const store = { variables: {}, mappings: {} };
        const evm = STORAGE(store);

        const state = new State<Inst, Expr>();
        state.stack.push(new Val(1n));
        state.stack.push(new Val(2n));
        evm.SSTORE(state);

        expect(store.variables).to.have.keys('2');
    });

    it('should find storage variable', function () {
        const sol = `contract C {
            uint256 val1 = 5;
            uint256 val2 = 7;

            fallback() external payable {
                val1 += 3;
                val2 += 11;
            }
        }`;
        const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        expect(evm.variables).to.be.have.keys('0', '1');
        expect(state.stmts).to.be.have.length(3);

        expect(`${state.stmts[0]}`).to.be.equal('var1 += 0x3;');
        expect(`${state.stmts[1]}`).to.be.equal('var2 += 0xb;');
        expect(`${state.last}`).to.be.equal('return;');
    });

    it.skip('should find storage struct', function () {
        const sol = `contract C {
            struct T {
                uint256 val1;
                uint256 val2;
            }

            T t;

            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
            }
        }`;
        const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
        evm.start();
        expect(evm.variables).to.be.have.keys('0x0', '0x1');
        expect(evm.mappings).to.be.deep.equal({});
    });

    describe('mappings', () => {
        it('should find mapping loads and stores', function () {
            const sol = `contract C {
                mapping (address => uint256) map1;
                mapping (address => uint256) map2;
                mapping (address => mapping (address => uint256)) allowance;

                fallback() external payable {
                    map1[msg.sender] += 3;
                    map2[msg.sender] += 5;
                    allowance[address(this)][msg.sender] -= 11;
                }
            }`;
            const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(state.stmts).to.be.have.length(4);

            expect(state.stmts[0]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    0,
                    [new Symbol0('msg.sender')],
                    new Add(
                        new MappingLoad(evm.mappings, 0, [new Symbol0('msg.sender')]),
                        new Val(3n, true)
                    )
                )
            );
            expect(`${state.stmts[0]}`).to.be.equal('mapping1[msg.sender] += 0x3;');

            expect(state.stmts[1]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    1,
                    [new Symbol0('msg.sender')],
                    new Add(
                        new MappingLoad(evm.mappings, 1, [new Symbol0('msg.sender')]),
                        new Val(5n, true)
                    )
                )
            );
            expect(`${state.stmts[1]}`).to.be.equal('mapping2[msg.sender] += 0x5;');

            expect(state.stmts[2]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    2,
                    [new Symbol0('address(this)'), new Symbol0('msg.sender')],
                    new Sub(
                        new MappingLoad(evm.mappings, 2, [
                            new Symbol0('address(this)'),
                            new Symbol0('msg.sender'),
                        ]),
                        new Val(11n, true)
                    )
                )
            );
            expect(`${state.stmts[2]}`).to.be.equal('mapping3[address(this)][msg.sender] -= 0xb;');

            expect(state.last).to.be.deep.equal(new Stop());

            expect(evm.variables).to.be.empty;
        });
    });
});
