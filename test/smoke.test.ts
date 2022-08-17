import { expect } from 'chai';
import { readFileSync } from 'fs';
import EVM from './utils/evmtest';

describe('smoke', () => {
    [
        {
            name: 'compound-0x3FDA67f7583380E67ef93072294a7fAc882FD7E7',
            count: 13245,
            lines: [],
        },
        {
            name: 'unicorn-0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
            count: 1214,
            lines: [
                /function freezeAccount\(address _arg0, bool _arg1\)/,
                /function transferOwnership\(address _arg0\)/,
            ],
        },
        {
            name: 'usdcproxy-0x5425890298aed601595a70AB815c96711a31Bc65',
            count: 750,
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
