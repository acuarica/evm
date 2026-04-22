import { describe, it } from 'vitest';

import { run } from '../src/forks.ts';
import { parseMetadata } from '../src/metadata.ts';

import { compile } from './utils/solc.ts';

describe('::forks', () => {

    it('single', (ctx) => {
        const src = `contract Test {
            uint total = 7;
            uint flag = 1;
            fallback() external payable {
                total = block.number + msg.value + 3;
                flag = 5 * 7;
                uint val = flag;
                total += 11 + val * val;
            }
        }`;
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
        run(bytecode);
    });

    it('if-else', (ctx) => {
        const src = `contract Test {
            uint total = 7;
            fallback() external payable {
                uint value;
                if (block.number == 11) value = 17;
                else value = 19;
                total += value;
            }
        }`;
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
        run(bytecode);
    });

    it('dynamic', (ctx) => {
        const src = `contract Test {
            uint total = 7;
            uint flag = 1;
            fallback() external payable {
                if (block.number >= 8) {
                    total = f(block.number == 8) + 3;
                }
                total += 5;
            }
            function f(bool opt) internal returns (uint) {
                flag = 2;
                if (opt) flag += g(7);
                return 1;
            }
            function g(uint a) internal pure returns (uint) {
                return 11 * a;
            }
        }`;
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
        run(bytecode);
    });
});