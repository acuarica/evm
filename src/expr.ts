type Is<N> = Extract<Expr, { name: N }>;

type Bin<N> = { name: N; lhs: Expr; rhs: Expr };

type Unary<N> = { name: N; val: Expr };

type Cmp<N> = { name: N; lhs: Expr; rhs: Expr; isEqual: boolean };

export type Expr = { eval(): Expr } & (
    | { name: 'Val'; val: bigint }
    | Bin<'Add'>
    | Bin<'Mul'>
    | Bin<'Sub'>
    | Bin<'Div'>
    | Bin<'Mod'>
    | Bin<'Exp'>
    | Cmp<'Lt'>
    | Cmp<'Gt'>
    | Bin<'Eq'>
    | Unary<'IsZero'>
    | Bin<'And'>
    | Bin<'Or'>
    | Bin<'Xor'>
    | Unary<'Not'>
);

const E = <T>(expr: T): T => Object.defineProperty(expr, 'eval', { enumerable: false });

export const Val = (val: bigint): Is<'Val'> =>
    E({
        name: 'Val' as const,
        val,
        eval() {
            return this;
        },
    });

export const isVal = (expr: Expr): expr is ReturnType<typeof Val> => expr.name === 'Val';

export const isZero = (expr: Expr): expr is ReturnType<typeof Val> =>
    isVal(expr) && expr.val === 0n;

export const Add = (lhs: Expr, rhs: Expr): Is<'Add'> =>
    E({
        name: 'Add',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs)
                ? Val(lhs.val + rhs.val)
                : isZero(lhs)
                ? rhs
                : isZero(rhs)
                ? lhs
                : Add(lhs, rhs);
        },
    });

export const Mul = (lhs: Expr, rhs: Expr): Is<'Mul'> =>
    E({
        name: 'Mul',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs)
                ? Val(lhs.val * rhs.val)
                : isZero(lhs) || isZero(rhs)
                ? Val(0n)
                : Mul(lhs, rhs);
        },
    });

export const Sub = (lhs: Expr, rhs: Expr): Is<'Sub'> =>
    E({
        name: 'Sub',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val - rhs.val) : Sub(lhs, rhs);
        },
    });

export const Div = (lhs: Expr, rhs: Expr): Is<'Div'> =>
    E({
        name: 'Div',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs)
                ? rhs.val === 0n
                    ? Div(lhs, rhs)
                    : Val(lhs.val / rhs.val)
                : isVal(rhs) && rhs.val === 1n
                ? lhs
                : Div(lhs, rhs);
        },
    });

export const Mod = (lhs: Expr, rhs: Expr): Is<'Mod'> =>
    E({
        name: 'Mod',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val % rhs.val) : Mod(lhs, rhs);
        },
    });

export const Exp = (lhs: Expr, rhs: Expr): Is<'Exp'> =>
    E({
        name: 'Exp',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) && rhs.val >= 0
                ? Val(lhs.val ** rhs.val)
                : Exp(lhs, rhs);
        },
    });

export const Lt = (lhs: Expr, rhs: Expr, isEqual = false): Is<'Lt'> =>
    E({
        name: 'Lt',
        lhs,
        rhs,
        isEqual,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val < rhs.val ? 1n : 0n) : Lt(lhs, rhs);
        },
    });

export const Gt = (lhs: Expr, rhs: Expr, isEqual = false): Is<'Gt'> =>
    E({
        name: 'Gt',
        lhs,
        rhs,
        isEqual,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val > rhs.val ? 1n : 0n) : Gt(lhs, rhs);
        },
    });

export const Eq = (lhs: Expr, rhs: Expr): Is<'Eq'> =>
    E({
        name: 'Eq',
        lhs,
        rhs,
        eval() {
            return Eq(this.lhs.eval(), this.rhs.eval());
        },
    });

export const IsZero = (val: Expr): Is<'IsZero'> =>
    E({
        name: 'IsZero',
        val,
        eval() {
            const val = this.val.eval();

            return isVal(val)
                ? val.val === 0n
                    ? Val(1n)
                    : Val(0n)
                : val.name === 'Lt'
                ? Gt(val.lhs, val.rhs, !val.isEqual)
                : val.name === 'Gt'
                ? Lt(val.lhs, val.rhs, !val.isEqual)
                : val.name === 'IsZero'
                ? Val(val.val)
                : IsZero(val);
        },
    });

export const And = (lhs: Expr, rhs: Expr): Is<'And'> =>
    E({
        name: 'And',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();

            return isVal(lhs) && isVal(rhs)
                ? Val(lhs.val & rhs.val)
                : isVal(lhs) && /^[f]+$/.test(lhs.val.toString(16))
                ? rhs
                : isVal(rhs) && /^[f]+$/.test(rhs.val.toString(16))
                ? lhs
                : isVal(lhs) && rhs.name === 'And' && isVal(rhs.lhs) && lhs.val === rhs.lhs.val
                ? rhs.rhs
                : And(lhs, rhs);
        },
    });

export const Or = (lhs: Expr, rhs: Expr): Is<'Or'> =>
    E({
        name: 'Or',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val | rhs.val) : Or(lhs, rhs);
        },
    });

export const Xor = (lhs: Expr, rhs: Expr): Is<'Xor'> =>
    E({
        name: 'Xor',
        lhs,
        rhs,
        eval() {
            const lhs = this.lhs.eval();
            const rhs = this.rhs.eval();
            return isVal(lhs) && isVal(rhs) ? Val(lhs.val ^ rhs.val) : Xor(lhs, rhs);
        },
    });

export const Not = (val: Expr): Is<'Not'> =>
    E({
        name: 'Not',
        val,
        eval() {
            return isVal(val) ? Val(~val.val) : Not(val);
        },
    });
