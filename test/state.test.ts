import { expect } from 'chai';
import { Stack, State } from 'sevm';

describe('state', function () {
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
            expect(() => stack.pop()).to.throw(Error, 'POP with empty stack');
        });

        it('should `dup`licate successfully', function () {
            const stack = new Stack<string>();
            stack.push('x');
            stack.push('y');
            stack.push('z');
            expect(stack.values).to.be.deep.equal(['z', 'y', 'x']);
            stack.dup(0);
            expect(stack.values).to.be.deep.equal(['z', 'z', 'y', 'x']);
            stack.dup(3);
            expect(stack.values).to.be.deep.equal(['x', 'z', 'z', 'y', 'x']);
            expect(() => stack.dup(-1)).to.throw(
                Error,
                'Unsupported position for duplication operation'
            );
            expect(() => stack.dup(16)).to.throw(
                Error,
                'Unsupported position for duplication operation'
            );
            expect(() => stack.dup(5)).to.throw(
                Error,
                'Invalid duplication operation, position was not found'
            );
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
            expect(() => stack.swap(0)).to.throw(Error, 'Unsupported position for swap operation');
            expect(() => stack.swap(17)).to.throw(Error, 'Unsupported position for swap operation');
            expect(() => stack.swap(3)).to.throw(
                Error,
                'Invalid swap operation, position was not found'
            );
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

            expect(() => stack.push(1)).to.throw(Error, 'Stack too deep');
        });
    });

    describe('State', function () {
        it('should `clone` a state without aliasing with its source', function () {
            const state = new State<number, number>();
            expect(state.halted).to.be.false;
            expect(state.stmts).to.be.empty;
            expect(state.memory).to.be.empty;

            state.memory[0] = 1;
            const clone = state.clone();

            state.memory[1] = 2;

            expect(state.memory).to.have.keys([0, 1]);
            expect(clone.memory).to.have.keys([0]);
        });

        it('should `clone` a state while aliasing its contents', function () {
            const expr = { x: 'a' as 'a' | 'b' };

            const state = new State<never, { x: 'a' | 'b' }>();
            state.memory[0] = expr;
            const clone = state.clone();

            state.memory[1] = expr;
            expr.x = 'b';

            expect(state.memory).to.have.keys([0, 1]);
            expect(state.memory[0]).to.be.deep.equal({ x: 'b' });
            expect(state.memory[1]).to.be.deep.equal({ x: 'b' });

            expect(clone.memory).to.have.keys([0]);
            expect(state.memory[0]).to.be.deep.equal({ x: 'b' });
        });
    });
});
