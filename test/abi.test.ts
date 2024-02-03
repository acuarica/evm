import { expect } from 'chai';

import { type SigMember, isElemType, parseSig, sighash } from 'sevm';

import { FunctionFragment } from 'ethers';

import { compile } from './utils/solc';
import { inspect } from 'util';

const sigs = ([
    {
        sig: 'owner()',
        fmt: 'owner()',
        member: { name: 'owner', inputs: [] }
    }, {
        sig: ' spacingFn( ) ',
        fmt: 'spacingFn()',
        member: { name: 'spacingFn', inputs: [] }
    }, {
        sig: 'singleParamFn( address arg0 )',
        fmt: 'singleParamFn(address)',
        member: {
            name: 'singleParamFn', inputs: [
                { name: 'arg0', type: 'address' }
            ]
        }
    }, {
        sig: 'singleUnnamedParamFn( address )',
        fmt: 'singleUnnamedParamFn(address)',
        member: {
            name: 'singleUnnamedParamFn', inputs: [
                { type: 'address' }
            ]
        }
    }, {
        sig: 'multipleParamsFn ( uint256 arg1, bool, address arg3) ',
        fmt: 'multipleParamsFn(uint256,bool,address)',
        member: {
            name: 'multipleParamsFn', inputs: [
                { name: 'arg1', type: 'uint256' },
                { type: 'bool' },
                { name: 'arg3', type: 'address' }
            ]
        }
    }, {
        sig: 'canonicalTypesFn(uint arg1, int arg2) ',
        fmt: 'canonicalTypesFn(uint256,int256)',
        member: {
            name: 'canonicalTypesFn', inputs: [
                { name: 'arg1', type: 'uint256' },
                { name: 'arg2', type: 'int256' }
            ]
        }
    }, {
        sig: 'nonFixedArrayFn(uint[] arg1, int arg2, uint arg3)',
        fmt: 'nonFixedArrayFn(uint256[],int256,uint256)',
        member: {
            name: 'nonFixedArrayFn', inputs: [
                { name: 'arg1', type: 'uint256[]', arrayLength: null, arrayType: { type: 'uint256' } },
                { name: 'arg2', type: 'int256' },
                { name: 'arg3', type: 'uint256' },
            ]
        }
    }, {
        sig: 'fixedArrayFn(uint[16] arg1, int[32] arg2)',
        fmt: 'fixedArrayFn(uint256[16],int256[32])',
        member: {
            name: 'fixedArrayFn', inputs: [
                { name: 'arg1', type: 'uint256[16]', arrayLength: 16, arrayType: { type: 'uint256' } },
                { name: 'arg2', type: 'int256[32]', arrayLength: 32, arrayType: { type: 'int256' } },
            ]
        }
    }, {
        sig: 'multiDimArray(uint[16][][32] arg1)',
        fmt: 'multiDimArray(uint256[16][][32])',
        member: {
            name: 'multiDimArray', inputs: [{
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
            }]
        }
    }, {
        sig: 'tupleFn( (uint[8], address)[] arg1, int arg2)',
        fmt: 'tupleFn((uint256[8],address)[],int256)',
        member: {
            name: 'tupleFn', inputs: [{
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
    }, {
        sig: 'tupleFn2 ( address arg1,(uint256, uint256 )[] arg2)',
        fmt: 'tupleFn2(address,(uint256,uint256)[])',
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
    }, {
        sig: 'nestedTupleFn((uint256[], (address, function[4], bool) )[] arg1)',
        fmt: 'nestedTupleFn((uint256[],(address,function[4],bool))[])',
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
    }, {
        sig: 'sameAsSighash((uint256,uint256)[])',
        fmt: 'sameAsSighash((uint256,uint256)[])',
        member: {
            name: 'sameAsSighash', inputs: [{
                type: 'tuple[]',
                arrayLength: null,
                arrayType: {
                    type: 'tuple',
                    components: [
                        { type: 'uint256' },
                        { type: 'uint256' }
                    ]
                }
            }]
        }
    }, {
        sig: 'emptyTupleFn( ()[] arg1)',
        fmt: 'emptyTupleFn(()[])',
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
] satisfies { sig: string, fmt: string, member: SigMember }[]);

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

        sigs.forEach(({ sig, member }) => {
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

    describe('sighash', function () {
        sigs.forEach(({ fmt, member }) => {
            it(`should get formatted signature \`${fmt}\``, function () {
                expect(sighash(member)).to.deep.equal(fmt);
            });
        });
    });

    describe('abi', function () {
        it('encode tuples types in public parameters', function () {
            const src = `contract Test {
            struct S { uint a; uint[] b; T[] c; }
            struct T { uint x; uint y; }
            function f(S memory, T memory, uint) public pure {}
            function g(T[16][][32] memory arg1) public pure {}
            function f((uint a ,uint a) memory arg1) public pure {}
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
