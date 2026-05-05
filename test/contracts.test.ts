import { describe, it, expect } from 'vitest';

import { Printer, run } from '../src/fork.ts';
import { parseMetadata } from '../src/metadata.ts';

import { compile } from './utils/solc.ts';
import { domTree, f, mermaid, mermaid2, mermaidTree } from './utils/mermaid.ts';
import { strict as assert } from 'assert';
import { inspect } from 'util';

describe('::sevm', () => {

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

    it('if-only', (ctx) => {
        const src = `contract Test {
            uint total = 7;
            fallback() external payable {
                uint value;
                if (block.number == 11) value = 17;
                total += value;
            }
        }`;
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
        const bbs = run(bytecode);
        const diagram = mermaid(bbs, 'dfdfskjsdjksdkjdf');

        expect(diagram).matchSnapshotmd('mermaid');
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
        const bbs = run(bytecode);
        const diagram = mermaid(bbs, 'dfdfskjsdjksdkjdf');

        expect(diagram).matchSnapshotmd('mermaid');
    });

    it('nested-if-else-dif-stacks', (ctx) => {
        const src = `contract Test {
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
        }`;
        const opts = { optimizer: { enabled: true } };
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx, opts).bytecode);
        const bbs = run(bytecode);
        const diagram = mermaid(bbs, 'dfdfskjsdjksdkjdf');

        expect(diagram).matchSnapshotmd('mermaid states');

        const preds = f(bbs);
        console.log('preds', preds);
        const { doms, tree } = domTree(preds);
        console.log('doms', doms);
        expect(mermaidTree(tree)).matchSnapshotmd('mermaid tree');

        const a = ast(0);
        console.log(inspect(a, { depth: null }));
        renderAst(a);
    });

    it('loop', (ctx) => {
        const src = `contract Test {
            uint total = 7;
            fallback() external payable {
                uint value = 0;
                for (uint i = 0; i < msg.value; i++) {
                    value *= 3 + i;
                }
                total += value;
            }
        }`;
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
        run(bytecode);
    });

    it('dynamic', (ctx) => {
        // ctx.expect.getState().snapshotState.snapshotUpdateState
        // ctx.task.suite?.
        // ctx.expect.addSnapshotSerializer()
        const src = `contract Test {
            uint total = 7;
            uint flag = 1;
            fallback() external payable {
                // if (block.number >= 8) {
                //     total = f(block.number == 8) + 3;
                // }
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
        }`;
        const opts = { optimizer: { enabled: true } };
        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx, opts).bytecode);
        const bbs = run(bytecode);

        const diagram = mermaid(bbs, 'dfdfskjsdjksd');

        expect(diagram).matchSnapshotmd('mermaid');
    });
});