import { expect } from 'chai';

import { isElemType, parseSig } from 'sevm';

import { FunctionFragment } from 'ethers';

import { compile } from './utils/solc';
import { inspect } from 'util';

describe('::abi', function () {
    describe('isElemType', function () {
        it('should determine `uint/function` as elem types', function () {
            expect(isElemType('uint')).to.be.true;
            expect(isElemType('function')).to.be.true;
            expect(isElemType('owner')).to.be.false;
            expect(isElemType('event')).to.be.false;
        });
    });

    describe('parseSig', function () {

        ['  ', '  function  '].forEach(prefix => {
            it(`should accept optional \`${prefix}\` prefix`, function () {
                const sig = parseSig(prefix + 'singleParamFn( address arg0 )');
                expect(sig).to.deep.equal({
                    name: 'singleParamFn', inputs: [
                        { name: 'arg0', type: 'address' }
                    ]
                });
            });
        });

        [
            {
                sig: 'owner()',
                member: { name: 'owner', inputs: [] }
            },
            {
                sig: ' spacingFn( ) ',
                member: { name: 'spacingFn', inputs: [] }
            },
            {
                sig: 'singleParamFn( address arg0 )',
                member: {
                    name: 'singleParamFn', inputs: [
                        { name: 'arg0', type: 'address' }
                    ]
                }
            },
            {
                sig: 'singleUnnamedParamFn( address )',
                member: {
                    name: 'singleUnnamedParamFn', inputs: [
                        { type: 'address' }
                    ]
                }
            },
            {
                sig: 'multipleParamsFn ( uint256 arg1, bool, address arg3) ',
                member: {
                    name: 'multipleParamsFn', inputs: [
                        { name: 'arg1', type: 'uint256' },
                        { type: 'bool' },
                        { name: 'arg3', type: 'address' }
                    ]
                }
            },
            {
                sig: 'nonFixedArrayFn(uint[] arg1, int arg2, uint arg3)',
                member: {
                    name: 'nonFixedArrayFn', inputs: [
                        { name: 'arg1', type: 'uint256[]', arrayLength: null, arrayType: { type: 'uint256' } },
                        { name: 'arg2', type: 'int256' },
                        { name: 'arg3', type: 'uint256' },
                    ]
                }
            },
            {
                sig: 'fixedArrayFn(uint[16] arg1, int[32] arg2)',
                member: {
                    name: 'fixedArrayFn', inputs: [
                        { name: 'arg1', type: 'uint256[16]', arrayLength: 16, arrayType: { type: 'uint256' } },
                        { name: 'arg2', type: 'int256[32]', arrayLength: 32, arrayType: { type: 'int256' } },
                    ]
                }
            },
            {
                sig: 'multiDimArray(uint[16][][32] arg1)',
                member: {
                    name: 'multiDimArray', inputs: [
                        {
                            name: 'arg1',
                            type: 'uint256[16][][32]',
                            arrayLength: 32,
                            arrayType: {
                                type: 'uint256[16][]',
                                arrayLength: null,
                                arrayType: {
                                    type: 'uint256[16]',
                                    arrayLength: 16,
                                    arrayType: { type: 'uint256' }
                                }
                            }
                        },
                    ]
                }
            },
            {
                sig: 'tupleFn( (uint[8], address)[] arg1, int arg2)',
                member: {
                    name: 'tupleFn', inputs: [
                        {
                            name: 'arg1', type: 'tuple[]', arrayLength: null, arrayType: {
                                type: 'tuple',
                                components: [
                                    { type: 'uint256[8]', arrayLength: 8, arrayType: { type: 'uint256' } },
                                    { type: 'address' },
                                ]
                            }
                        },
                        { name: 'arg2', type: 'int256' },
                    ]
                }
            },
            {
                sig: 'tupleFn2 ( address arg1,(uint256, uint256 )[] arg2)',
                member: {
                    name: 'tupleFn2', inputs: [
                        { name: 'arg1', type: 'address' },
                        {
                            name: 'arg2', type: 'tuple[]', arrayLength: null, arrayType: {
                                type: 'tuple',
                                components: [
                                    { type: 'uint256' },
                                    { type: 'uint256' }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                sig: 'nestedTupleFn ((uint256[], (address, function[4], bool) )[] arg1)',
                member: {
                    name: 'nestedTupleFn', inputs: [
                        {
                            name: 'arg1', type: 'tuple[]', arrayLength: null, arrayType: {
                                type: 'tuple',
                                components: [
                                    { type: 'uint256[]', arrayLength: null, arrayType: { type: 'uint256' } },
                                    {
                                        type: 'tuple', components: [
                                            { type: 'address' },
                                            { type: 'function[4]', arrayLength: 4, arrayType: { type: 'function' } },
                                            { type: 'bool' },
                                        ]
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            {
                sig: 'emptyTupleFn( ()[] arg1)',
                member: {
                    name: 'emptyTupleFn', inputs: [
                        {
                            name: 'arg1', type: 'tuple[]', arrayLength: null, arrayType: {
                                type: 'tuple',
                                components: []
                            }
                        },
                    ]
                }
            },
        ].forEach(({ sig, member }) => {
            it(`should parse signature \`${sig}\``, function () {
                const res = parseSig(sig);
                expect(res).to.deep.equal(member);
            });
        });

        [
            ['function ()', 'Expected function name'],
            ['function function()', 'Expected function name'],
        ].forEach(([sig, error]) => {
            it(`should raise error '${error}' for function signature \`${sig}\``, function () {
                expect(() => parseSig(sig)).to.throw(error);
            });
        });
    });

    describe.skip('abi', function () {
        it('should accept tuples', function () {
            const sig = 'someFunc((uint256,uint256)[])';
            const func = FunctionFragment.from(sig);
            expect(func.format()).to.be.equal(sig);
        });

        it('should accept params with `uint/int`', function () {
            const sig = 'someFunc(uint,int)';
            const func = FunctionFragment.from(sig);
            expect(func.format()).to.be.equal('someFunc(uint256,int256)');
        });

        it('encode tuples types in public parameters', function () {
            // https://docs.soliditylang.org/en/develop/abi-spec.html#handling-tuple-types
            const src = `contract Test {
            struct S { uint a; uint[] b; T[] c; }
            struct T { uint x; uint y; }
            function f(S memory, T memory, uint) public pure {}
            function g(T[16][][32] memory arg1) public pure {}
        }`;
            const { abi, evm } = compile(src, '0.8.16', this);
            console.log(evm.methodIdentifiers);
            console.log(abi[1].inputs[0]);
            const a = FunctionFragment.from(abi[1]);
            console.log('abi', inspect(abi[1], { depth: 10 }));
            console.log(inspect(a.inputs[0], { depth: 10 }));
            // console.log(a.inputs[1]);
            expect(FunctionFragment.from(abi[0]).format()).to.be.equal(
                'f((uint256,uint256[],(uint256,uint256)[]),(uint256,uint256),uint256)'
            );
        });
    });
});
