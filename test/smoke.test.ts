import { expect } from 'chai';
import { readFileSync } from 'fs';
import EVM from './utils/evmtest';

describe('smoke', () => {
    [
        {
            name: 'Compound-0x3FDA67f7583380E67ef93072294a7fAc882FD7E7',
            count: 13245,
            lines: [],
        },
        {
            name: 'DAI-0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
            count: 2128,
            lines: [],
        },
        {
            name: 'ENS-0x314159265dD8dbb310642f98f50C066173C1259b',
            count: 284,
            lines: [],
        },
        {
            name: 'UnicornToken-0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
            count: 1214,
            lines: [
                /^event Transfer\(address indexed _arg0, address indexed _arg1, uint256 _arg2\);$/m,
                /^event FrozenFunds\(address _arg0, bool _arg1\);$/m,
                /^mapping \(address => unknown\) public balanceOf;$/m,
                /^mapping \(address => unknown\) public frozenAccount;$/m,
                /^mapping \(address => mapping \(address => uint256\)\) public allowance;$/m,
                /^mapping \(address => mapping \(address => unknown\)\) mapping4;$/m,
                /^unknown public owner;$/m,
                /^unknown public decimals;$/m,
                /^unknown public totalSupply;$/m,
                /^function approve\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function transferFrom\(address _arg0, address _arg1, uint256 _arg2\) public payable returns \(uint256\) {$/m,
                /^function mintToken\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function symbol\(\) public payable {$/m,
                /^function transfer\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function freezeAccount\(address _arg0, bool _arg1\) public payable {$/m,
                /^function transferOwnership\(address _arg0\) public payable {$/m,
            ],
        },
        {
            name: 'USDC-0x5425890298aed601595a70AB815c96711a31Bc65',
            count: 750,
            lines: [
                /^address public implementation;$/m,
                /^address public admin;$/m,
                /^function upgradeTo\(address _arg0\) public {$/m,
                /^function upgradeToAndCall\(address _arg0, bytes _arg1\) public payable {$/m,
                /^function changeAdmin\(address _arg0\) public {$/m,
            ],
        },
        {
            name: 'WETH-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            count: 1577,
            lines: [],
        },
    ].forEach(contract => {
        describe(`for ${contract.name}`, () => {
            let evm: EVM;

            before(() => {
                const bytecode = readFileSync(`./test/smoke/${contract.name}.bytecode`, 'utf8');
                evm = new EVM(bytecode);
            });

            it(`should decode bytecode correctly`, () => {
                const opcodes = evm.getOpcodes();
                expect(opcodes).to.be.of.length(contract.count);
            });

            it(`should decompile contract correctly`, () => {
                const text = evm.decompile();

                for (const line of contract.lines) {
                    expect(text).to.match(line);
                }
            });
        });
    });
});
