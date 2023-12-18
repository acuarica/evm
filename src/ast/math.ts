import { Bin, type Expr, Val } from './index';

export class Add extends Bin {
    readonly tag = 'Add';
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

export class Mul extends Bin {
    readonly tag = 'Mul';
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

export class Sub extends Bin {
    readonly tag = 'Sub';
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

export class Div extends Bin {
    readonly tag = 'Div';
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

export class Mod extends Bin {
    readonly tag = 'Mod';
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() && rhs.val !== 0n
            ? new Val(lhs.val % rhs.val)
            : new Mod(lhs, rhs);
    }
}

export class Exp extends Bin {
    readonly tag = 'Exp';
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal() && right.val >= 0
            ? new Val(left.val ** right.val)
            : new Exp(left, right);
    }
}
