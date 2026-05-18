import { describe, it, expect } from 'vitest';

import { Contract } from '../src/contract.ts';
import { print } from '../src/sevm.ts';

// import './utils/snapshot.ts';
import { compile } from './utils/solc.ts';
import { mermaid } from './utils/mermaid.ts';

describe('::contracts', () => {

    describe.each([
        ['no opt', undefined],
        ['opt', { optimizer: { enabled: true } }]
    ])('%s', (suffix, options) => {

        it.for([
            ['single block', `contract Test {
                uint total = 7;
                uint flag = 1;
                fallback() external payable {
                    total = block.number + msg.value + 3;
                    flag = 5 * 7;
                    uint val = flag;
                    total += 11 + val * val;
                }
            }`],

            ['if then', `contract Test {
                uint total = 7;
                fallback() external payable {
                    uint value;
                    if (block.number == 11) value = 17;
                    total += value;
                }
            }`],

            ['if else', `contract Test {
                uint total = 7;
                fallback() external payable {
                    uint value;
                    if (block.number == 11) value = 17;
                    else value = 19;
                    total += value;
                }
            }`],

            ['nested if dif stacks', `contract Test {
                uint total = 7;
                fallback() external payable {
                    uint value;
                    if (block.number == 11) {
                        uint sum = msg.value;
                        if (msg.value > 123) {
                            value = 17 * sum * sum;
                        } else {
                            value = 19 * sum;
                        }
                        if (msg.value > 1234) {
                            value *= 23;
                        }
                    } else {
                        value = 19;
                    }
                    total += value;
                }
            }`],

            ['for loop', `contract Test {
                uint total = 7;
                fallback() external payable {
                    uint value = 0;
                    for (uint i = 0; i < msg.value; i++) {
                        value *= 3 + i;
                    }
                    total += value;
                }
            }`],

            ['dynamic', `contract Test {
                uint total = 7;
                uint flag = 1;
                fallback() external payable {
                    if (block.number >= 8) {
                        total = f(block.number == 8) + 3;
                        total += 3;
                    }
                    total += g(5);
                    total += g(7);
                    total += 17;
                }
                function f(bool opt) internal returns (uint) {
                    flag = 9;
                    uint val = 11;
                    if (opt) val += g(7);
                    return val;
                }
                function g(uint a) internal pure returns (uint) {
                    uint value = 0;
                    for (uint i = 0; i < a; i++) {
                        value *= 3 + i;
                    }
                    return 11 * value;
                }
            }`],

            ['external pure methods', `contract Test {
                function method1(address, uint64) external pure returns (uint) { return 5; }
                function method2(uint256) external pure returns (uint) { return 7; }
            }`],

        ])('%s', ([title, src], ctx) => {
            const path = `${title} ${suffix}`;

            const contract = new Contract(compile(src, '0.7.6', ctx, options).bytecode);

            expect(mermaid(contract.states, title)).to.matchSnapshotmd('mermaid', path);
            expect(print(contract.states)).to.matchSnapshotmd('cpp states', path);
            // expect(contract.selectors).matchSnapshotmd('json selectors', path);
        });
    });
});