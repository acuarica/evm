import { arrayify } from '../src/bytes.ts';
import { frontier, exec, halts } from '../src/forks.ts';
import { parseMetadata } from '../src/metadata.ts';
import { Stack } from "../src/state.ts";

import { compile } from './utils/solc.ts';
import { inspect } from 'node:util';

function main() {
    const src = `contract Test {
            uint total = 7;
            uint flag = 1;
            fallback() external payable {
                if (block.number == 8) {
                    total = f() + 3;
                }
                total += 5;
            }
            function f() internal returns (uint) {
                flag = 2;
                return 1;
            }
        }`;

    const { bytecode, metadata } = parseMetadata(compile(src, '0.7.6', null).bytecode);

    console.log(metadata);

    const a = [...frontier.decode(bytecode)];
    // console.log(a);
    let prevop = undefined;
    const bbs = [];
    const buf = arrayify(bytecode);
    let bb = [];
    const PStack = class extends Stack<object> {
        params: object[] = [];

        override pop(): object {
            if (this.values.length === 0) {
                const param = { eparam: 1 };
                this.params.push(param);
                super.push(param);
            }
            return super.pop();
        }

        override swap(secondPosition: number): void {
            if (secondPosition >= this.values.length) {
                const params = [...Array((secondPosition + 1) - this.values.length).keys()].map(i => ({ sparam: i + this.values.length }));
                this.params.push(...params);
                this.values.push(...params);
            }
            super.swap(secondPosition);
        }

        override dup(pos: number): void {
            if (pos >= this.values.length) {
                const params = [...Array((pos + 1) - this.values.length).keys()].map(i => ({ dparam: i + this.values.length }));
                this.params.push(...params);
                this.values.push(...params);
            }

            super.dup(pos);
        }
    };
    let stack = new PStack();
    for (const op of frontier.decode(buf)) {
        if (op.mnemonic === 'JUMP' || op.mnemonic === 'JUMPI') {
            if (prevop?.data === null) {
                console.log('dynamic jump', op.format());
            }
        }
        prevop = op;

        exec(op, stack);
        console.log(`${op} |= ${stack}`);
        bb.push(op);

        if (halts(op.mnemonic) || buf[op.nextpc] === frontier.opcodes.JUMPDEST) {
            console.log('--- bb ---')
            bbs.push({ bb, stack });
            bb = [];
            stack = new PStack();
        }
    }
    console.log('basic blocks', inspect(bbs, { depth: null }));
}

main();