import { expect } from 'chai';

import { ExecError, Memory, Stack, State } from 'sevm';

describe('::state', function () {
    describe('Stack', function () {
        it('should create a `new` instance with an empty stack', function () {
            const stack = new Stack<never>();
            expect(stack.values).to.deep.equal([]);
        });

        it('should `push` and get `top` successfully', function () {
            const stack = new Stack<string>();
            stack.push('1');
            expect(stack.top).to.be.equal('1');
            expect(stack.values).to.be.deep.equal(['1']);
            stack.push('0');
            expect(stack.top).to.be.equal('0');
            expect(stack.values).to.be.deep.equal(['0', '1']);
        });

        it('should `pop` successfully', function () {
            const stack = new Stack<number>();
            stack.push(1);
            stack.push(2);
            expect(stack.values).to.be.deep.equal([2, 1]);
            expect(stack.pop()).to.be.equal(2);
            expect(stack.values).to.be.deep.equal([1]);
            expect(stack.pop()).to.be.equal(1);
            expect(stack.values).to.be.deep.equal([]);
            expect(() => stack.pop()).to.throw(ExecError, 'POP with empty stack');
        });

        it('should `swap` successfully', function () {
            const stack = new Stack<string>();
            stack.push('a');
            stack.push('b');
            stack.push('c');
            expect(stack.values).to.be.deep.equal(['c', 'b', 'a']);
            stack.swap(1);
            expect(stack.values).to.be.deep.equal(['b', 'c', 'a']);
            stack.swap(2);
            expect(stack.values).to.be.deep.equal(['a', 'c', 'b']);
            expect(() => stack.swap(0)).to.throw(ExecError, 'Unsupported position for swap operation');
            expect(() => stack.swap(17)).to.throw(ExecError, 'Unsupported position for swap operation');
            expect(() => stack.swap(3)).to.throw(ExecError, 'Position not found for swap operation');
        });

        it('should `clone` successfully', function () {
            const stack1 = new Stack<number>();
            stack1.push(3);
            expect(stack1.values).to.be.deep.equal([3]);
            const stack2 = stack1.clone();
            expect(stack2.values).to.be.deep.equal([3]);
            stack1.pop();
            expect(stack1.values).to.be.deep.equal([]);
            expect(stack2.values).to.be.deep.equal([3]);
        });

        it('should `throw` when stack is too deep', function () {
            const stack = new Stack<number>();
            for (let i = 0; i < 1024; i++) {
                stack.push(1);
            }

            expect(() => stack.push(1)).to.throw(ExecError, 'Stack too deep');
        });
    });

    describe('Memory', function () {
        it('should create a `new` instance which is empty', function () {
            const memory = Memory.new();
            expect(memory.size).to.be.equal(0);
        });

        it('should `get` entries after `set`ting them', function () {
            const memory = Memory.new();
            memory.set(32n, 2);
            memory.set(64n, 3);

            expect(memory.size).to.be.equal(2);
            expect(memory.get(32n)).to.be.equal(2);
            expect(memory.get(64n)).to.be.equal(3);
            expect([...memory.entries()]).to.be.deep.equal([[32n, 2], [64n, 3]]);
        });

        it('should `clone` an instance without aliasing its keys', function () {
            const memory = Memory.new();
            memory.set(32n, 2);
            memory.set(64n, 3);

            const clone = memory.clone();
            clone.set(32n, 0);
            clone.set(96n, 4);

            expect(memory.size).to.be.equal(2);
            expect(memory.get(32n)).to.be.equal(2);
            expect(memory.get(64n)).to.be.equal(3);
            expect([...memory.entries()]).to.be.deep.equal([[32n, 2], [64n, 3]]);

            expect(clone.size).to.be.equal(3);
            expect(clone.get(32n)).to.be.equal(0);
            expect(clone.get(64n)).to.be.equal(3);
            expect(clone.get(96n)).to.be.equal(4);
            expect([...clone.entries()]).to.be.deep.equal([[32n, 0], [64n, 3], [96n, 4]]);
        });

        it('should `clone` an instance aliasing its values', function () {
            const memory = Memory.new<{ x: number }>();
            memory.set(32n, { x: 1 });

            const clone = memory.clone();
            clone.get(32n)!.x = 2;

            expect(memory.get(32n)).to.be.deep.equal({ x: 2 });
        });
    });

    describe('State', function () {
        it('should `clone` an instance without aliasing its keys', function () {
            const state = new State<number, number>();
            expect(state.halted).to.be.false;
            expect(state.stmts).to.be.empty;
            expect(state.memory.size).to.be.equal(0);
            expect(state.nlocals).to.be.equal(0);

            state.memory.set(0n, 1);
            state.nlocals += 3;
            const clone = state.clone();

            state.memory.set(1n, 2);

            expect([...state.memory.keys()]).to.have.keys([0, 1]);
            expect([...clone.memory.keys()]).to.have.keys([0]);
            expect(clone.nlocals).to.be.equal(3);
        });

        it('should `clone` an instance aliasing its values', function () {
            const expr = { x: 'a' as 'a' | 'b' };

            const state = new State<never, { x: 'a' | 'b' }>();
            state.memory.set(0n, expr);
            const clone = state.clone();

            state.memory.set(1n, expr);
            expr.x = 'b';

            expect([...state.memory.keys()]).to.have.members([0n, 1n]);
            expect(state.memory.get(0n)).to.be.deep.equal({ x: 'b' });
            expect(state.memory.get(1n)).to.be.deep.equal({ x: 'b' });

            expect([...clone.memory.keys()]).to.have.keys([0n]);
            expect(state.memory.get(0n)).to.be.deep.equal({ x: 'b' });
        });
    });
});
