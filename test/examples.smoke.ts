import { expect } from 'chai';
import chalk = require('chalk');
import { providers, utils } from 'ethers';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { inspect } from 'util';
import { Contract } from '../src';
import './utils/selector';

describe('examples', function () {
    [
        {
            name: 'Compound-0x3FDA67f7583380E67ef93072294a7fAc882FD7E7',
            count: 13208,
            lines: [],
        },
        {
            name: 'CryptoKitties-0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
            count: 8098,
            lines: [],
        },
        {
            name: 'DAI-0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
            count: 2118,
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
            name: 'USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            count: 807,
            lines: [
                /^address public implementation;/m,
                /^address public admin;/m,
                /^function upgradeTo\(address _arg0\) public {$/m,
                /^function upgradeToAndCall\(address _arg0, bytes _arg1\) public payable {$/m,
                /^function changeAdmin\(address _arg0\) public {$/m,
            ],
        },
        {
            name: 'WETH-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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
        },
    ].forEach(({ name, count, lines }) => {
        describe(`${name}`, () => {
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
                    return `${name!}(${parts.join(',')})`;
                });

            let contract: Contract;
            let text: string;

            before(async () => {
                const path = await fetchBytecode(name);
                const bytecode = readFileSync(path, 'utf8');
                contract = new Contract(bytecode).patch();
                text = contract.decompile();
            });

            it(`should decode bytecode`, () => {
                expect(contract.evm.opcodes).to.be.of.length(count);
            });

            it(`should detect functions`, () => {
                expect(contract.getFunctions()).to.include.members(functions);
            });

            it(`should detect variables`, () => {
                expect(contract.getFunctions()).to.include.members(variables);
            });

            it(`should detect mappings`, () => {
                expect(contract.getFunctions()).to.include.members(mappings);
            });

            it('functions, variables & mappings should cover `getFunctions`', () => {
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

            lines.forEach(line => {
                it.skip(`should match decompiled bytecode to '${truncate(line.source)}'`, () => {
                    expect(text).to.match(line);
                });
            });
        });
    });
});

async function fetchBytecode(contract: string): Promise<string> {
    const BASE_PATH = './test/examples/';
    const addr = chalk.blue;
    const provider = new providers.EtherscanProvider();
    const path = `${BASE_PATH}${contract}.bytecode`;

    if (!existsSync(path)) {
        const [name, address] = contract.split('-');
        console.info(`Fetching code for ${name} at ${addr(address)} into ${BASE_PATH}`);
        const code = await provider.getCode(address);

        if (!existsSync(BASE_PATH)) {
            mkdirSync(BASE_PATH);
        }
        writeFileSync(path, code);
    }

    return path;
}

function truncate(str: string) {
    return str.length < 50 ? str : str.substring(0, 50) + '...';
}
