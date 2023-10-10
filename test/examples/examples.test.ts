import { readFileSync } from 'fs';
import { inspect } from 'util';
import { expect } from 'chai';
import { FunctionFragment } from 'ethers';

import { Contract } from 'sevm';

import abis from './abis';

describe('examples', function () {
    [
        {
            name: 'Compound-0x3FDA67f7583380E67ef93072294a7fAc882FD7E7' as const,
            count: 13208,
            lines: [],
            ercs: [] as const,
        },
        {
            name: 'CryptoKitties-0x06012c8cf97BEaD5deAe237070F9587f8E7A266d' as const,
            count: 8098,
            lines: [],
            ercs: ['ERC165'] as const,
        },
        {
            name: 'DAI-0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359' as const,
            count: 2118,
            lines: [],
            ercs: ['ERC20'] as const,
            checkEvents: false,
        },
        {
            name: 'ENS-0x314159265dD8dbb310642f98f50C066173C1259b' as const,
            count: 284,
            lines: [],
            ercs: [] as const,
        },
        {
            name: 'UnicornToken-0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7' as const,
            count: 1214,
            lines: [
                /^event Transfer\(address indexed _arg0, address indexed _arg1, uint256 _arg2\);$/m,
                /^event FrozenFunds\(address _arg0, bool _arg1\);$/m,
                /^mapping \(address => unknown\) public balanceOf;$/m,
                /^mapping \(address => unknown\) public frozenAccount;$/m,
                /^mapping \(address => mapping \(address => uint256\)\) public allowance;$/m,
                // /^mapping \(address => mapping \(address => unknown\)\) mapping4;$/m,
                /^unknown public owner;/m,
                /^unknown public decimals;/m,
                /^unknown public totalSupply;/m,
                /^function approve\(address _arg0, uint256 _arg1\) public payable returns \(uint256\) {$/m,
                /^function transferFrom\(address _arg0, address _arg1, uint256 _arg2\) public payable returns \(uint256\) {$/m,
                /^function mintToken\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function name\(\)/m,
                /^function symbol\(\) public payable {$/m,
                /^function transfer\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function freezeAccount\(address _arg0, bool _arg1\) public payable {$/m,
                /^function transferOwnership\(address _arg0\) public payable {$/m,
            ],
            ercs: ['ERC20'] as const,
            checkEvents: false,
        },
        {
            /**
             * Bytecode of USDC _proxy_ contract.
             * Fetched with this RPC provider https://api.avax-test.network/ext/bc/C/rpc.
             *
             * See it on Snowtrace https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65.
             */
            name: 'USDC-0x5425890298aed601595a70AB815c96711a31Bc65' as const,
            count: 741,
            lines: [
                /^address public implementation;/m,
                /^address public admin;/m,
                /^function upgradeTo\(address _arg0\) public {$/m,
                /^function upgradeToAndCall\(address _arg0, bytes _arg1\) public payable {$/m,
                /^function changeAdmin\(address _arg0\) public {$/m,
            ],
            ercs: [] as const,
        },
        {
            name: 'WETH-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const,
            count: 1555,
            lines: [
                /^mapping \(address => unknown\) public balanceOf;$/m,
                /^mapping \(address => mapping \(address => uint256\)\) public allowance;$/m,
                /^unknown public decimals;/m,
                /^function name\(\)/m,
                /^function approve\(address _arg0, uint256 _arg1\)/m,
                /^function totalSupply\(\)/m,
                /^function transferFrom\(address _arg0, address _arg1, uint256 _arg2\)/m,
                /^function withdraw\(uint256 _arg0\)/m,
                /^function symbol\(\)/m,
                /^function transfer\(address _arg0, uint256 _arg1\)/m,
                /^function deposit\(\)/m,
            ],
            ercs: ['ERC20'] as const,
        },
    ].forEach(({ name, count, lines, ercs, checkEvents }) => {
        describe(`${name}`, function () {
            const defs = lines.map(line =>
                line.source
                    .replace(/\\/g, '')
                    .replace('^', '')
                    .replace('$', '')
                    .replace('{', '')
                    .replace(';', '')
            );
            const functions = defs
                .filter(line => line.startsWith('function '))
                .map(line => FunctionFragment.from(line.trim()).format());
            const variables = defs
                .filter(line => line.includes(' public ') && !line.includes('('))
                .map(line => line.split(' ').pop()! + '()');
            const mappings = defs
                .filter(line => line.startsWith('mapping ') && line.includes(' public '))
                .map(line => {
                    const parts = line
                        .replace(/mapping /g, '')
                        .replace(/\(/g, '')
                        .replace(/\)/g, '')
                        .replace(/ => /g, ' ')
                        .replace(' public ', ' ')
                        .split(' ');
                    const name = parts.pop();
                    parts.pop();
                    return `${name}(${parts.join(',')})`;
                });

            let contract: Contract;
            let text: string;

            before(function () {
                const { events, functions } = abis[name];
                const bytecode = readFileSync(`./test/examples/${name}.bytecode`, 'utf8');
                contract = new Contract(bytecode).patchevs(...events).patchfns(...functions);
                text = contract.decompile();
            });

            it(`should decode bytecode`, function () {
                expect(contract.evm.opcodes).to.be.of.length(count);
            });

            it(`should detect functions`, function () {
                expect(contract.getFunctions()).to.include.members(functions);
            });

            it(`should detect variables`, function () {
                expect(contract.getFunctions()).to.include.members(variables);
            });

            it(`should detect mappings`, function () {
                expect(contract.getFunctions()).to.include.members(mappings);
            });

            it('functions, variables & mappings should cover `getFunctions`', function () {
                if (lines.length > 0) {
                    const expected = [...functions, ...variables, ...mappings];
                    expect(
                        new Set(contract.getFunctions()),
                        `actual ${inspect(contract.getFunctions())} != expected ${inspect(
                            expected
                        )}`
                    ).to.be.deep.equal(new Set(expected));
                }
            });

            const trunc = (s: string): string => (s.length < 50 ? s : s.substring(0, 50) + '...');
            lines.forEach(line =>
                it(`should match decompiled bytecode to '${trunc(line.source)}'`, function () {
                    expect(text).to.match(line);
                })
            );

            ercs.forEach(erc =>
                it(`should detect \`${erc}\` interface`, function () {
                    expect(contract.isERC(erc, checkEvents)).to.be.true;
                })
            );
        });
    });
});
