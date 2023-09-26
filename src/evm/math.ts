import { Bin, type Expr, Val } from './expr';

export class Add extends Bin('Add', '+', 11) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? new Val(left.val + right.val)
            : left.isZero()
            ? right
            : right.isZero()
            ? left
            : new Add(left, right);
    }
}

export class Mul extends Bin('Mul', '*', 12) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal()
            ? new Val(lhs.val * rhs.val)
            : lhs.isZero() || rhs.isZero()
            ? new Val(0n)
            : new Mul(lhs, rhs);
    }
}

export class Sub extends Bin('Sub', '-', Add.prec) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? new Val(left.val - right.val)
            : right.isZero()
            ? left
            : new Sub(left, right);
    }
}

export class Div extends Bin('Div', '/', Mul.prec) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? right.val === 0n
                ? new Div(left, right)
                : new Val(left.val / right.val)
            : right.isVal() && right.val === 1n
            ? left
            : new Div(left, right);
    }
}

export class Mod extends Bin('Mod', '%', Mul.prec) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val % rhs.val) : new Mod(lhs, rhs);
    }
}

export class Exp extends Bin('Exp', '**', 14) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal() && right.val >= 0
            ? new Val(left.val ** right.val)
            : new Exp(left, right);
    }
}
