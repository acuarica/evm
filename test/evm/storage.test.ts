import { expect } from 'chai';

import { EVM, STEP, State, sol, yul } from 'sevm';
import type { Expr, Inst } from 'sevm/ast';
import { Add, Info, MappingLoad, MappingStore, Msg, Stop, Sub, Val } from 'sevm/ast';

import { compile } from '../utils/solc';

describe('evm::storage', function () {
    it('should store variable', function () {
        const step = STEP();

        const state = new State<Inst, Expr>();
        state.stack.push(new Val(1n));
        state.stack.push(new Val(2n));
        step.SSTORE(state);

        expect(step.variables).to.have.keys('2');
    });

    it('should detect storage variable', function () {
        const src = `contract C {
            uint256 val1 = 5;
            uint256 val2 = 7;
            fallback() external payable {
                val1 += 3;
                val2 += 11;
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        expect(evm.variables).to.be.have.keys('0', '1');
        expect(state.stmts).to.be.have.length(3);

        expect(sol`${state.stmts[0]}`).to.be.equal('var1 += 0x3;');
        expect(sol`${state.stmts[1]}`).to.be.equal('var2 += 0xb;');
        expect(sol`${state.last}`).to.be.equal('return;');
    });

    it.skip('should detect packed storage variable', function () {
        const src = `contract C {
            uint256 val1 = 0;
            uint128 val2 = 7;
            uint128 val3 = 11;
            function() external payable {
                // unchecked {

                val1 = block.number + 5;
                // val2 = uint128(block.number) + 7;
                val3 = uint128(block.number) + 11;

                // uint64 val4 = 9;
                // }
            }
        }`;
        const evm = new EVM(compile(src, '0.5.5', this).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        // state.stmts.forEach(stmt => console.log(sol`${stmt.eval()}`));
        // state.stmts.forEach(stmt => console.log(yul`${stmt.eval()}`));

        expect(Object.keys(evm.variables)).to.be.have.length(3);
    });

    it.skip('should find storage struct when no optimized', function () {
        const src = `contract Test {
            struct T {
                uint256 val1;
                uint256 val2;
            }
            T t;
                uint256 val3;
            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
                val3 += 7;
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this, { enabled: false }).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);
        state.stmts.forEach(stmt => console.log(sol`${stmt}`));
        state.stmts.forEach(stmt => console.log(yul`${stmt}`));

        expect(evm.variables).to.be.have.keys('0x0', '0x1');
        expect(evm.mappings).to.be.deep.equal({});
    });

    it('should not find storage struct when optimized', function () {
        const src = `contract Test {
            struct T { uint256 val1; uint256 val2; }
            T t;
            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this, { enabled: true }).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        expect(state.stmts).to.be.have.length(3);

        expect(sol`${state.stmts[0]}`).to.be.equal('var1 += 0x3;');
        expect(sol`${state.stmts[1]}`).to.be.equal('var2 += 0xb;');
        expect(sol`${state.stmts[2]}`).to.be.equal('return;');

        expect(yul`${state.stmts[0]}`).to.be.equal('sstore(0x0, add(0x3, sload(0x0)))');
        expect(yul`${state.stmts[1]}`).to.be.equal('sstore(0x1, add(0xb, sload(0x1)))');
        expect(yul`${state.stmts[2]}`).to.be.equal('stop()');

        expect(evm.variables).to.be.have.keys('0', '1');
        expect(evm.mappings).to.be.deep.equal({});
    });

    describe('mappings', function () {
        it('should find mapping loads and stores', function () {
            const src = `contract C {
                mapping (address => uint256) map1;
                mapping (address => uint256) map2;
                mapping (address => mapping (address => uint256)) allowance;

                fallback() external payable {
                    map1[msg.sender] += 3;
                    map2[msg.sender] += 5;
                    allowance[address(this)][msg.sender] -= 11;
                }
            }`;
            const evm = new EVM(compile(src, '0.7.6', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(state.stmts).to.be.have.length(4);

            expect(state.stmts[0]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    0,
                    [Msg.sender],
                    new Add(new MappingLoad(evm.mappings, 0, [Msg.sender]), new Val(3n, true))
                )
            );
            expect(sol`${state.stmts[0]}`).to.be.equal('mapping1[msg.sender] += 0x3;');

            expect(state.stmts[1]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    1,
                    [Info.CALLER],
                    new Add(new MappingLoad(evm.mappings, 1, [Msg.sender]), new Val(5n, true))
                )
            );
            expect(sol`${state.stmts[1]}`).to.be.equal('mapping2[msg.sender] += 0x5;');

            expect(state.stmts[2]).to.be.deep.equal(
                new MappingStore(
                    evm.mappings,
                    2,
                    [Info.ADDRESS, Msg.sender],
                    new Sub(
                        new MappingLoad(evm.mappings, 2, [Info.ADDRESS, Msg.sender]),
                        new Val(11n, true)
                    )
                )
            );
            expect(sol`${state.stmts[2]}`).to.be.equal(
                'mapping3[address(this)][msg.sender] -= 0xb;'
            );
            expect(state.last).to.be.deep.equal(new Stop());
            expect(evm.variables).to.be.empty;
        });
    });
});
