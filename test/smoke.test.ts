import { expect } from 'chai';
import { utils } from 'ethers';
import { readFileSync } from 'fs';
import { inspect } from 'util';
import EVM from './utils/evmtest';

describe('smoke', () => {
    [
        {
            name: 'Compound-0x3FDA67f7583380E67ef93072294a7fAc882FD7E7',
            count: 13245,
            lines: [],
        },
        {
            name: 'CryptoKitties-0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
            count: 8108,
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
                /^function name\(\)/m,
                /^function symbol\(\) public payable {$/m,
                /^function transfer\(address _arg0, uint256 _arg1\) public payable {$/m,
                /^function freezeAccount\(address _arg0, bool _arg1\) public payable {$/m,
                /^function transferOwnership\(address _arg0\) public payable {$/m,
            ],
        },
        {
            /**
             * Bytecode of USDC _proxy_ contract.
             * Fetched with this RPC provider https://api.avax-test.network/ext/bc/C/rpc.
             *
             * See it on Snowtrace https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65.
             */
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
            lines: [
                /^mapping \(address => unknown\) public balanceOf;$/m,
                /^mapping \(address => mapping \(address => uint256\)\) public allowance;$/m,
                /^unknown public decimals;$/m,
                /^function name\(\)/m,
                /^function approve\(address _arg0, uint256 _arg1\)/m,
                /^function totalSupply\(\)/m,
                /^function transferFrom\(address _arg0, address _arg1, uint256 _arg2\)/m,
                /^function withdraw\(uint256 _arg0\)/m,
                /^function symbol\(\)/m,
                /^function transfer\(address _arg0, uint256 _arg1\)/m,
                /^function deposit\(\)/m,
            ],
        },
    ].forEach(({ name, count, lines }) => {
        describe(`for ${name}`, () => {
            let evm: EVM;

            before(() => {
                const bytecode = readFileSync(`./test/data/${name}.bytecode`, 'utf8');
                evm = new EVM(bytecode);
            });

            it(`should decode bytecode correctly`, () => {
                const opcodes = evm.getOpcodes();
                expect(opcodes).to.be.of.length(count);
            });

            it(`should detect functions correctly`, () => {
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
                    .map(line => utils.Fragment.from(line).format());
                expect(evm.getFunctions()).to.include.members(functions);

                const variables = defs
                    .filter(line => line.includes(' public ') && !line.includes('('))
                    .map(line => line.split(' ').pop() + '()');
                expect(evm.getFunctions()).to.include.members(variables);

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
                        return `${name!}(${parts.join(',')})`;
                    });
                expect(evm.getFunctions()).to.include.members(mappings);

                if (lines.length > 0) {
                    const expected = [...functions, ...variables, ...mappings];
                    expect(
                        new Set(evm.getFunctions()),
                        `actual ${inspect(evm.getFunctions())} != expected ${inspect(expected)}`
                    ).to.be.deep.equal(new Set(expected));
                }
            });

            it(`should decompile contract correctly`, () => {
                const text = evm.decompile();

                for (const line of lines) {
                    expect(text).to.match(line);
                }
            });
        });
    });

    it.skip(`should correctly decode bytecode from open source`, () => {
        const BASE_PATH = './data/smoke/';
        const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
        const lines = csv.toString().split('\n');
        const addresses = lines
            .map(entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string])
            .filter(
                ([, address]) => address === '0xaf82a008d4922c7e3a4d7626663b17dbca9c2622'
                // && address !== '0x6b45B00D3d373C3DCE06c1D694e8b224924e2232'
            );

        // console.log(addresses);
        let i = 0;
        for (const [, address, name] of addresses) {
            const path = `${BASE_PATH}${name}-${address}.bytecode`;
            console.log(path);
            const bytecode = readFileSync(path, 'utf8');
            const evm = new EVM(bytecode);
            try {
                evm.getOpcodes();
                evm.decompile();
                console.log(evm.jumps);
            } catch (err) {
                console.log('Error in', path, 'at offset', evm.pc);
                throw err;
            }
            i++;
            if (i >= 20) break;
        }
    });

    it.skip(`should bytecode from open source`, () => {
        // 'mapping \(address => unknown\) public balanceOf;$/m,
        // const a = 'mapping (address => mapping (address => uint256)) public allowance';
        // const a= 'uint256 public decimals';
        //     const f = utils.Fragment. from(a).format();
        //     console.log(f);
    });
});
