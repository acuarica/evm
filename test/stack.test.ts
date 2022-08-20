import { expect } from 'chai';
import { Stack } from '../src/stack';

describe('stack', () => {
    it('should create an instance', () => {
        const stack = new Stack<never>();
        expect(stack).to.be.an.instanceof(Stack);
    });

    it('should push successfully', () => {
        const stack = new Stack<string>();
        stack.push('1');
        expect(stack.elements).to.deep.equal(['1']);
        stack.push('0');
        expect(stack.elements).to.deep.equal(['0', '1']);
    });

    it('should pop successfully', () => {
        const stack = new Stack<number>();
        stack.push(1);
        stack.push(2);
        expect(stack.elements).to.deep.equal([2, 1]);
        expect(stack.pop()).to.deep.equal(2);
        expect(stack.elements).to.deep.equal([1]);
        expect(stack.pop()).to.deep.equal(1);
        expect(stack.elements).to.deep.equal([]);
        expect(() => stack.pop()).to.throw(Error, 'POP with empty stack');
    });

    it('should duplicate successfully', () => {
        const stack = new Stack<string>();
        stack.push('x');
        stack.push('y');
        stack.push('z');
        expect(stack.elements).to.deep.equal(['z', 'y', 'x']);
        stack.dup(0);
        expect(stack.elements).to.deep.equal(['z', 'z', 'y', 'x']);
        stack.dup(3);
        expect(stack.elements).to.deep.equal(['x', 'z', 'z', 'y', 'x']);
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

    it('should swap successfully', () => {
        const stack = new Stack<string>();
        stack.push('a');
        stack.push('b');
        stack.push('c');
        expect(stack.elements).to.deep.equal(['c', 'b', 'a']);
        stack.swap(1);
        expect(stack.elements).to.deep.equal(['b', 'c', 'a']);
        stack.swap(2);
        expect(stack.elements).to.deep.equal(['a', 'c', 'b']);
        expect(() => stack.swap(0)).to.throw(Error, 'Unsupported position for swap operation');
        expect(() => stack.swap(17)).to.throw(Error, 'Unsupported position for swap operation');
        expect(() => stack.swap(3)).to.throw(
            Error,
            'Invalid swap operation, position was not found'
        );
    });

    it('should clone successfully', () => {
        const stack1 = new Stack<number>();
        stack1.push(3);
        expect(stack1.elements).to.deep.equal([3]);
        const stack2 = stack1.clone();
        expect(stack2.elements).to.deep.equal([3]);
        stack1.pop();
        expect(stack1.elements).to.deep.equal([]);
        expect(stack2.elements).to.deep.equal([3]);
    });

    it('should reset successfully', () => {
        const stack = new Stack<number>();
        stack.push(100);
        expect(stack.elements).to.deep.equal([100]);
        stack.reset();
        expect(stack.elements).to.deep.equal([]);
    });
});
