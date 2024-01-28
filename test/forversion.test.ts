import { expect } from 'chai';

import { Contract, Shanghai } from 'sevm';
import { Add, CallDataLoad, MappingLoad, MappingStore, Props, Require, Return, Revert, SStore, Sha3, Stop, Val, Variable } from 'sevm/ast';

import { eventSelector, fnselector } from './utils/selector';
import { VERSIONS, type Version, compile } from './utils/solc';

describe(`::forversion`, function () {
    forVersion('empty', (compile, fallback, version) => {
        let contract: Contract;

        // eslint-disable-next-line mocha/no-top-level-hooks
        before(function () {
            const src = 'contract Empty { }';
            contract = new Contract(compile(src, this).bytecode);
        });

        it(`should get metadata hash for minimal contract definition`, function () {
            const HASHES = {
                '0.5.5': ['bzzr0', '61cfa0b8ea656ddbb7d387a8cd4fa87e694ed85d11c93d3f00964aa99fd2ef54'],
                '0.5.17': ['bzzr1', '9e364c1993091e0e8fd8895ef98d43bd325053b76e18433d879d3be18085a210'],
                '0.6.12': ['ipfs', 'QmbHEL45gDehV886FXqUJ5JFvWWZ2ZzFz75JEANWPBN9gq'],
                '0.7.6': ['ipfs', 'Qmf1g3GNsgpLdGx4TVkQPZBpBNARw4GDtR2i5QGXQSWixu'],
                '0.8.16': ['ipfs', 'QmQ5UGtrYrGDU9btfXYzuy1dZNQKQy7duqeLxbYfyunosc'],
                '0.8.21': ['ipfs', 'QmNSLs8r9KjVRzEoddMkRhASQCPvUd9BnEuUpUgH7aqC5f'],
            } as const;

            expect(contract.metadata).to.be.not.undefined;

            const hash = HASHES[version];
            expect(contract.metadata!.protocol).to.be.equal(hash[0]);
            expect(contract.metadata!.solc).to.be.equal(version === '0.5.5' ? '' : version);

            expect(contract.metadata!.hash).to.be.equal(hash[1]);
            expect(contract.metadata!.url).to.be.equal(`${hash[0]}://${hash[1]}`);
        });

        it('should not have functions nor events', function () {
            expect(contract.functions).to.be.empty;
            expect(contract.functionBranches).to.be.empty;
            expect(contract.events).to.be.empty;
        });

        it('should have 1 block & 1 `revert`', function () {
            expect(contract.blocks).to.be.of.length(1);

            const block = contract.blocks.get(0)!;

            expect(contract.bytecode[block.pcend - 1]).to.be.equal(new Shanghai().opcodes().REVERT);

            expect(block.states).to.be.of.length(1);
            const state = block.states[0]!;
            expect(state.last?.eval())
                .to.be.deep.equal(new Revert(new Val(0n), new Val(0n), []));

            expect(contract.main.length).to.be.at.least(1);
            expect(contract.main.at(-1)?.eval()).to.be.deep.equal(
                new Revert(new Val(0n), new Val(0n), [])
            );
        });

        it('should `decompile` bytecode', function () {
            const text = contract.solidify({ license: null, pragma: false, contractName: 'Empty' });
            expect(text).to.be.equal(`contract Empty {

    ${fallback}() external payable {
        revert();
    }

}
`);
        });
    });

    forVersion('dispatch', compile => {
        it("should decompile function's return type and non-payable", function () {
            const src = `contract Test {
                function get() external pure returns (uint256) { return 5; }
            }`;
            const contract = new Contract(compile(src, this).bytecode).reduce().patchfns('get()');
            const text = contract.solidify();
            expect(text, `decompiled text\n${text}`).to.match(
                /function get\(\) public view returns \(uint256\) {$/m
            );
        });

        it('should `decompile` a contract with a single `external` method', function () {
            const src = `contract Test {
                function set() external payable { }
                function get() external pure returns (uint256) { return 5; }
            }`;
            const contract = new Contract(compile(src, this).bytecode).reduce().patchfns('get()');
            const text = contract.solidify();
            expect(text, `decompiled text\n${text}`).to.match(
                /function get\(\) public returns \(uint256\) {$/m
            );
        });

        it('should `decompile` a contract with multiple `external` functions', function () {
            const src = `contract Test {
                function balanceOf(uint256 from) external pure returns (uint256) { return from; }
                function symbol() external pure returns (uint256) { return 3; }
                function thisAddress() external view returns (address) { return address(this); }
            }`;
            const contract = new Contract(compile(src, this).bytecode).patchfns(
                'balanceOf(uint256)',
                'symbol()',
                'thisAddress()'
            );
            expect(contract.getFunctions()).to.include.members([
                'balanceOf(uint256)',
                'symbol()',
                'thisAddress()',
            ]);

            expect(Object.keys(contract.functions)).to.be.of.length(3);

            const fn = contract.functions[fnselector('balanceOf(uint256)')];
            expect(fn.stmts.filter(stmt => stmt.name === 'Require').length).to.be.greaterThan(0);
            expect(fn.stmts.at(-1)).instanceOf(Return);

            const text = contract.solidify();
            expect(text, `decompiled bytecode\n${text}`).to.match(/return address\(this\);$/m);
        });

        it('should detect selectors only reachable functions', function () {
            const sig = 'balanceOf(uint256)';
            const src = `interface IERC20 {
                function ${sig} external view returns (uint256);
            }
    
            contract Test {
                function get() external view returns (uint256) {
                    IERC20 addr = IERC20 (0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
                    return addr.balanceOf(7);
                }
            }`;
            const contract = new Contract(compile(src, this).bytecode);
            expect(contract.functions).to.have.keys(fnselector('get()'));
        });
    });

    forVersion('internal', compile => {
        describe('with `internal` method with no arguments', function () {
            let contract: Contract;

            before(function () {
                const src = `contract Test {
                mapping(address => uint256) private _values;
                function _msgSender() internal view returns (address) {
                    return msg.sender;
                }
                function setInline(uint256 value) external {
                    _values[msg.sender] = value + 3;
                }
                function setInternal(uint256 value) external {
                    _values[_msgSender()] = value + 5;
                }
            }`;
                contract = new Contract(compile(src, this).bytecode);
            });

            [
                { sig: 'setInline(uint256)', value: 3n },
                { sig: 'setInternal(uint256)', value: 5n },
            ].forEach(({ sig, value }) => {
                const selector = fnselector(sig);

                it(`should find \`SStore\`s in \`#${selector}\`\`${sig}\` blocks`, function () {
                    const evalm = (expr: MappingStore) => {
                        return new MappingStore(expr.slot.eval(), expr.mappings, expr.location, expr.items, expr.data.eval(), expr.structlocation);
                    };

                    const fn = contract.functions[selector];

                    expect(fn).to.not.be.undefined;

                    expect(evalm(fn.stmts.at(-2) as MappingStore)).to.be.deep.equal(
                        new MappingStore(
                            new Sha3(
                                new Val(0n),
                                new Val(64n),
                                [Props['msg.sender'], new Val(0n)]
                            ),
                            contract.mappings,
                            0,
                            [Props['msg.sender']],
                            new Add(new CallDataLoad(new Val(4n)), new Val(value)),

                        )
                    );
                    expect(fn.stmts.at(-1)).to.be.deep.equal(new Stop());
                });
            });

            it('should not have `variables`', function () {
                expect(Object.keys(contract.mappings)).to.have.length(1);
                expect(Object.keys(contract.variables)).to.have.length(0);
            });

            it('should `decompile` bytecode', function () {
                const text = contract.reduce().solidify();
                expect(text, text).to.not.match(/return msg.sender;/);
                expect(text, text).to.contain('mapping1[msg.sender] = _arg0 + 0x3');
                expect(text, text).to.contain('mapping1[msg.sender] = _arg0 + 0x5');
            });
        });

        describe('with `internal` method with different arguments', function () {
            let contract: Contract;

            before(function () {
                const src = `contract Test {
                mapping(address => uint256) private _values;
                function _getValue(address from) internal view returns (uint256) {
                    return _values[from];
                }
                function getForSender() external view returns (uint256) {
                    return _getValue(msg.sender);
                }
                function getForArg(address from) external view returns (uint256) {
                    return _getValue(from);
                }
            }`;
                contract = new Contract(compile(src, this).bytecode);
            });

            [
                { sig: 'getForSender()', value: Props['msg.sender'] },
                { sig: 'getForArg(address)', value: new CallDataLoad(new Val(4n)) },
            ].forEach(({ sig, value }) => {
                const selector = fnselector(sig);

                it('should find `SLoad`s in blocks', function () {
                    const stmts = contract.functions[selector].stmts;
                    expect(stmts.length).to.be.at.least(1);

                    const stmt = stmts.at(-1) as Return & { args: [MappingLoad] };
                    stmt.args[0].eval = function () {
                        return new MappingLoad(this.slot.eval(), this.mappings, this.location, this.items, this.structlocation);
                    };

                    expect(stmts.at(-1)?.eval()).to.be.deep.equal(
                        new Return(new Val(128n), new Val(32n), [
                            new MappingLoad(
                                new Sha3(new Val(0n), new Val(64n), [value, new Val(0n)]),
                                contract.mappings,
                                0,
                                [value],
                            ),
                        ])
                    );
                });
            });

            it('should not have `variables`', function () {
                expect(Object.keys(contract.mappings)).to.have.length(1);
                expect(Object.keys(contract.variables)).to.have.length(0);
            });

            it('should `decompile` bytecode', function () {
                const text = contract.solidify();
                expect(text, text).to.contain('return mapping1[msg.sender];');
                expect(text, text).to.contain('return mapping1[_arg0];');
            });
        });

        describe('with `internal` method without inlining function', function () {
            let contract: Contract;

            before(function () {
                const src = `contract Test {
                mapping(uint256 => uint256) private _values;
                function _getValue(uint256 n) internal view returns (uint256) {
                    uint256 result = 0;
                    for (uint256 i = 0; i < n; i++) {
                        result += _values[i];
                    }
                    return result;
                }
                function getFor5() external view returns (uint256) {
                    return _getValue(5);
                }
                function getForArg(uint256 n) external view returns (uint256) {
                    return _getValue(n);
                }
            }`;
                contract = new Contract(compile(src, this).bytecode);
            });

            it.skip('should `decompile` bytecode', function () {
                const text = contract.solidify();
                expect(text, text).to.match(/storage\[keccak256\(0, 0\)\]/);
            });
        });
    });

    forVersion('events', (compile, fallback, version) => {
        it('should emit unknown event', function () {
            const src = `contract Test {
            event Event0(string);
            function emitEvent() external {
                emit Event0("Hello, world!");
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode);
            const Event0 = eventSelector('Event0(string)');
            expect(contract.events).to.have.keys(Event0);
            const text = contract.reduce().solidify();
            expect(text, text).to.match(/event /);
            expect(text, text).to.match(/log\(0x[a-fA-F\d]+(, 0x[a-fA-F\d]+)+\);/);
        });

        it('should emit hashed event', function () {
            const src = `contract Test {
            event Transfer(uint256, address);
            function f(uint256 value) external {
                uint256 newValue = value + 0x123;
                emit Transfer(newValue, address(this));
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode).patchevs(
                'Transfer(uint256,address)'
            );
            expect(contract.getEvents()).to.be.deep.equal(['Transfer(uint256,address)']);
            const text = contract.reduce().solidify();
            expect(text, text).to.match(/event Transfer\(uint256 _arg0, address _arg1\);$/m);
            expect(text, text).to.match(/emit Transfer\(_arg0 \+ 0x123, address\(this\)\);$/m);
        });

        it('should emit hashed event with indexed topics', function () {
            const src = `contract Test {
            event Send(uint256, address indexed);
            function f() external {
                emit Send(123, address(this));
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode).patchevs('Send(uint256,address)');
            expect(contract.getEvents()).to.be.deep.equal(['Send(uint256,address)']);
            const text = contract.reduce().solidify();
            expect(text, text).to.match(/event Send\(uint256 indexed _arg0, address _arg1\);$/m);
            expect(text, text).to.match(/emit Send\(address\(this\), 0x7b\);$/m);
        });

        it('should emit hashed event with no arguments', function () {
            const src = `contract Test {
            event Transfer();
            function f() external {
                emit Transfer();
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode).patchevs('Transfer()');
            expect(contract.getEvents()).to.be.deep.equal(['Transfer()']);
            const text = contract.solidify();
            expect(text, text).to.match(/event Transfer\(\);$/m);
            expect(text, text).to.match(/emit Transfer\(\);$/m);
        });

        it('should emit anonymous event', function () {
            const src = `contract Test {
            event Transfer(uint256, address) anonymous;
            function f() external {
                emit Transfer(123, address(this));
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode);
            expect(contract.getEvents()).to.be.deep.equal([]);
            const text = contract.reduce().solidify();
            expect(text, text).to.not.match(/event/);
            expect(text, text).to.match(/log\(0x7b, address\(this\)\);$/m);
        });

        it('should emit anonymous event with no arguments', function () {
            const src = `contract Test {
            event Transfer() anonymous;
            function f() external {
                emit Transfer();
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode);
            expect(contract.getEvents()).to.be.deep.equal([]);
            const text = contract.solidify();
            expect(text, text).to.not.match(/event/);
            expect(text, text).to.match(/log\(\);$/m);
        });

        it('should emit anonymous event with both arguments and no arguments', function () {
            const src = `contract Test {
            event Transfer() anonymous;
            event Send(uint256, uint256) anonymous;
            ${fallback}() external payable {
                emit Transfer();
                emit Send(123, 124);
            }
        }`;
            const contract = new Contract(compile(src, this).bytecode);
            expect(contract.getEvents()).to.be.deep.equal([]);

            const is8 = version === '0.8.16' || version === '0.8.21';
            const text = (is8 ? contract.reduce() : contract).solidify();
            expect(text, text).to.not.match(/event/);
            expect(text, text).to.match(/log\(\);$/m);
            expect(text, text).to.match(/log\(0x7b, 0x7c\);$/m);
        });
    });

    forVersion('variables', (compile, _fallback) => {
        describe('with private variables in different locations', function () {
            let contract: Contract;

            before(function () {
                const src = `contract Test {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }
            }`;
                contract = new Contract(compile(src, this).bytecode).reduce();
            });

            [
                { sig: 'setValue0(uint256)', value: 0n },
                { sig: 'setValue0(bytes32)', value: 1n },
            ].forEach(({ sig, value }) => {
                const selector = fnselector(sig);
                it(`should find \`SStore\`s in \`#${selector}\`\`${sig}\` blocks`, function () {
                    const stmts = contract.functions[selector].stmts;
                    expect(stmts.length).to.be.of.greaterThanOrEqual(3);
                    expect(stmts.at(-3)).to.be.instanceOf(Require);
                    expect(stmts.at(-2)).to.be.deep.equal(
                        new SStore(
                            new Val(value),
                            new CallDataLoad(new Val(4n)),
                            contract.variables.get(value)
                        )
                    );
                    expect(stmts.at(-1)).to.be.deep.equal(new Stop());
                });
            });

            it('should get variables of different types', function () {
                const vars = [...contract.variables.values()];
                expect(vars).to.be.of.length(2);
                expect(vars[0]).to.be.deep.equal(
                    new Variable(null, [new CallDataLoad(new Val(4n))], 1)
                );
                expect(vars[1]).to.be.deep.equal(
                    new Variable(null, [new CallDataLoad(new Val(4n))], 2)
                );
            });

            it('should `decompile` bytecode', function () {
                const text = contract.solidify();
                expect(text, text).to.contain('unknown var1__1;');
                expect(text, text).to.contain('unknown var2__2;');
                expect(text, text).to.contain('var_1 = _arg0;');
                expect(text, text).to.contain('var_2 = _arg0;');
            });
        });

        it.skip('with private variables of different types', function () {
            const src = `contract Test {
            uint256 private value256;
            function setValue0(uint256 newValue) public { value256 = newValue; }

            bytes32 private value32;
            function setValue0(bytes32 newValue) public { value32 = newValue; }

            uint64 private value64;
            function setValue0(uint64 newValue) public { value64 = newValue; }

            bytes8 private value8;
            function setValue0(bytes8 newValue) public { value8 = newValue; }
        }`;
            const contract = new Contract(compile(src, this).bytecode);

            const text = contract.solidify();
            expect(text, text).to.match(/^unknown var1__1;/m);
            expect(text, text).to.match(/^unknown var2__2;/m);
            expect(text, text).to.match(/^unknown var3__3;/m);
            expect(text, text).to.match(/var1__1 = _arg0;/m);
            expect(text, text).to.match(/var2__2 = _arg0;/m);
            expect(text, text).to.match(/var3__3 = /m);

            // expect(contract.variables).to.be.of.length(4);
            expect(contract.variables).to.be.of.length(3);
        });

        it.skip('with a public `address` variable', function () {
            const src = `contract Test { address public owner; }`;
            const contract = new Contract(compile(src, this).bytecode).patchfns('owner()');

            expect(contract.getFunctions()).to.be.deep.equal(['owner()']);

            const text = contract.solidify();
            expect(text, text).to.match(/^address public owner;/m);
        });
    });
});

function forVersion(title: string,
    fn: (
        compile_: (
            content: string,
            context: Mocha.Context,
            opts?: Parameters<typeof compile>[3],
        ) => ReturnType<typeof compile>,
        fallback: 'fallback' | 'function',
        version: Version
    ) => void
) {
    describe(title, function () {
        VERSIONS.forEach(version => {
            if (version.startsWith(process.env['SOLC'] ?? '')) {
                // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#semantic-and-syntactic-changes
                // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#how-to-update-your-code
                const fallback = version.startsWith('0.5') ? 'function' : 'fallback';

                describe(`solc-v${version}`, function () {
                    fn(
                        (content, context, opts) => compile(content, version, context, opts),
                        fallback,
                        version
                    );
                });
            }
        });
    });
}
