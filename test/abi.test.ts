import { expect } from 'chai';
import { keccak256 } from 'js-sha3';

import { isElemType, parseSig, sighash, type SigMember } from 'sevm';

import { compile } from './utils/solc';

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
        sig: 'fnTy(function fn1)',
        fmt: 'fnTy(function)',
        sol: 'fnTy(function (uint) external fn1) ',
        member: {
            name: 'fnTy', inputs: [
                { name: 'fn1', type: 'function' },
            ]
        }
    }, {
        sig: 'multipleParamsFn(uint256 arg1, bool, address arg3)',
        fmt: 'multipleParamsFn(uint256,bool,address)',
        member: {
            name: 'multipleParamsFn', inputs: [
                { name: 'arg1', type: 'uint256' },
                { type: 'bool' },
                { name: 'arg3', type: 'address' },
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
        sig: 'nonFixedArrayFn(uint[] arg1, int arg2)',
        fmt: 'nonFixedArrayFn(uint256[],int256)',
        sol: 'nonFixedArrayFn(uint[] memory arg1, int arg2)',
        member: {
            name: 'nonFixedArrayFn', inputs: [
                { name: 'arg1', type: 'uint256[]', arrayLength: null, arrayType: { type: 'uint256' } },
                { name: 'arg2', type: 'int256' },
            ]
        }
    }, {
        sig: 'fixedArrayFn(uint[16] x, int[32] y)',
        fmt: 'fixedArrayFn(uint256[16],int256[32])',
        sol: 'fixedArrayFn(uint[16] memory x, int[32] memory y)',
        member: {
            name: 'fixedArrayFn', inputs: [
                { name: 'x', type: 'uint256[16]', arrayLength: 16, arrayType: { type: 'uint256' } },
                { name: 'y', type: 'int256[32]', arrayLength: 32, arrayType: { type: 'int256' } },
            ]
        }
    }, {
        sig: 'multiDimArray(uint[16][][32] arg1)',
        fmt: 'multiDimArray(uint256[16][][32])',
        sol: 'multiDimArray(uint[16][][32] memory arg1)',
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
        sol: 'tupleFn(TtupleFn[] memory arg1, int arg2)',
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
        sol: 'tupleFn2(address arg1, T2[] memory arg2)',
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
        sol: 'nestedTupleFn(TnestedTupleFn[] memory arg1)',
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
        sol: 'sameAsSighash(T2[] memory arg1)',
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
        sol: null,
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
] satisfies { sig: string, fmt: string, sol?: string | null, member: SigMember }[]);

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

    describe('get function selector from ABI', function () {
        sigs.forEach(({ sig, fmt, sol }) => {
            if (sol === null) return;

            it(`should find selector \`${sol ?? sig}`, function () {
                const selector = keccak256(fmt).slice(0, 8);
                this.test!.title += `#${selector}\``;

                const src = `contract Test {
                    struct T2 { uint x; uint y; }
                    struct TtupleFn { uint[8] x; address y; }
                    struct TnestedTupleFn_ { address a; function (uint) external [4] b; bool c; }
                    struct TnestedTupleFn { uint[] x; TnestedTupleFn_ y; }

                    function ${sol ?? sig} public pure {}
                }`;
                const { evm } = compile(src, '0.8.16', this);
                expect(evm.methodIdentifiers).to.deep.equal({ [fmt]: selector });
            });
        });
    });
});
