type Is<N> = Extract<Expr, { name: N }>;

type Bin<N> = { name: N; lhs: Expr; rhs: Expr };

type Unary<N> = { name: N; val: Expr };

type Cmp<N> = { name: N; lhs: Expr; rhs: Expr; isEqual: boolean };

type Shift<N> = { name: N; val: Expr; shift: Expr };

type Info =
    | 'this'
    | 'tx.origin'
    | 'msg.sender'
    | 'this.code.length'
    | 'tx.gasprice'
    | 'output.length'
    | 'block.coinbase'
    | 'block.timestamp'
    | 'block.number'
    | 'block.difficulty'
    | 'block.gaslimit'
    | 'chainid'
    | 'self.balance'
    | 'memory.length'
    | 'gasleft()';

export type Expr =
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
    | { name: 'Byte'; pos: Expr; data: Expr }
    | Shift<'Shl'>
    | Shift<'Shr'>
    | Shift<'Sar'>
    | { name: 'CallDataLoad'; location: Expr }
    | { name: 'Symbol0'; symbol: Info };

export const isVal = (expr: Expr): expr is Is<'Val'> => expr.name === 'Val';

export const isZero = (expr: Expr): expr is Is<'Val'> => isVal(expr) && expr.val === 0n;

export const Val = (val: bigint): Is<'Val'> => ({ name: 'Val', val });
export const Add = (lhs: Expr, rhs: Expr): Is<'Add'> => ({ name: 'Add', lhs, rhs });
export const Mul = (lhs: Expr, rhs: Expr): Is<'Mul'> => ({ name: 'Mul', lhs, rhs });
export const Sub = (lhs: Expr, rhs: Expr): Is<'Sub'> => ({ name: 'Sub', lhs, rhs });
export const Div = (lhs: Expr, rhs: Expr): Is<'Div'> => ({ name: 'Div', lhs, rhs });
export const Mod = (lhs: Expr, rhs: Expr): Is<'Mod'> => ({ name: 'Mod', lhs, rhs });
export const Exp = (lhs: Expr, rhs: Expr): Is<'Exp'> => ({ name: 'Exp', lhs, rhs });
export const Lt = (lhs: Expr, rhs: Expr, isEqual = false): Is<'Lt'> => ({
    name: 'Lt',
    lhs,
    rhs,
    isEqual,
});

export const Gt = (lhs: Expr, rhs: Expr, isEqual = false): Is<'Gt'> => ({
    name: 'Gt',
    lhs,
    rhs,
    isEqual,
});

export const Eq = (lhs: Expr, rhs: Expr): Is<'Eq'> => ({
    name: 'Eq',
    lhs,
    rhs,
});

export const IsZero = (val: Expr): Is<'IsZero'> => ({
    name: 'IsZero',
    val,
});

export const And = (lhs: Expr, rhs: Expr): Is<'And'> => ({
    name: 'And',
    lhs,
    rhs,
});

export const Or = (lhs: Expr, rhs: Expr): Is<'Or'> => ({
    name: 'Or',
    lhs,
    rhs,
});

export const Xor = (lhs: Expr, rhs: Expr): Is<'Xor'> => ({
    name: 'Xor',
    lhs,
    rhs,
});

export const Not = (val: Expr): Is<'Not'> => ({
    name: 'Not',
    val,
});

export const Byte = (pos: Expr, data: Expr): Is<'Byte'> => ({
    name: 'Byte',
    pos,
    data,
});

export const Shl = (val: Expr, shift: Expr): Is<'Shl'> => ({
    name: 'Shl',
    val,
    shift,
});

export const Shr = (val: Expr, shift: Expr): Is<'Shl'> => ({
    name: 'Shl',
    val,
    shift,
});

export const Sar = (val: Expr, shift: Expr): Is<'Sar'> => ({
    name: 'Sar',
    val,
    shift,
});

export const CallDataLoad = (location: Expr): Is<'CallDataLoad'> => ({
    name: 'CallDataLoad',
    location,
});

export const Symbol0 = (symbol: Info): Is<'Symbol0'> => ({
    name: 'Symbol0',
    symbol,
});

const Exec: Table = {
    Val: expr => expr,

    Add: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs)
            ? Val(lhs.val + rhs.val)
            : isZero(lhs)
            ? rhs
            : isZero(rhs)
            ? lhs
            : Add(lhs, rhs);
    },

    Mul: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs)
            ? Val(lhs.val * rhs.val)
            : isZero(lhs) || isZero(rhs)
            ? Val(0n)
            : Mul(lhs, rhs);
    },

    Sub: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val - rhs.val) : Sub(lhs, rhs);
    },

    Div: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs)
            ? rhs.val === 0n
                ? Div(lhs, rhs)
                : Val(lhs.val / rhs.val)
            : isVal(rhs) && rhs.val === 1n
            ? lhs
            : Div(lhs, rhs);
    },

    Mod: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val % rhs.val) : Mod(lhs, rhs);
    },

    Exp: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) && rhs.val >= 0 ? Val(lhs.val ** rhs.val) : Exp(lhs, rhs);
    },

    Lt: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val < rhs.val ? 1n : 0n) : Lt(lhs, rhs);
    },

    Gt: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val > rhs.val ? 1n : 0n) : Gt(lhs, rhs);
    },

    Eq: expr => {
        return Eq(exec(expr.lhs), exec(expr.rhs));
    },

    IsZero: expr => {
        const val = exec(expr.val);
        return isVal(val)
            ? val.val === 0n
                ? Val(1n)
                : Val(0n)
            : val.name === 'Lt'
            ? Gt(val.lhs, val.rhs, !val.isEqual)
            : val.name === 'Gt'
            ? Lt(val.lhs, val.rhs, !val.isEqual)
            : val.name === 'IsZero'
            ? val.val
            : IsZero(val);
    },

    And: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
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

    Or: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val | rhs.val) : Or(lhs, rhs);
    },

    Xor: expr => {
        const lhs = exec(expr.lhs);
        const rhs = exec(expr.rhs);
        return isVal(lhs) && isVal(rhs) ? Val(lhs.val ^ rhs.val) : Xor(lhs, rhs);
    },

    Not: expr => {
        const val = exec(expr.val);
        return isVal(val) ? Val(~val.val) : Not(val);
    },

    Byte: expr => {
        const pos = exec(expr.pos);
        const data = exec(expr.data);
        return isVal(data) && isVal(pos) ? Val((data.val >> pos.val) & 1n) : Byte(pos, data);
    },

    Shl: expr => {
        const val = exec(expr.val);
        const shift = exec(expr.shift);
        return isVal(val) && isVal(shift) ? Val(val.val << shift.val) : Shl(val, shift);
    },

    Shr: expr => {
        const val = exec(expr.val);
        const shift = exec(expr.shift);
        return isVal(val) && isVal(shift) ? Val(val.val >> shift.val) : Shr(val, shift);
    },

    Sar: expr => {
        const val = exec(expr.val);
        const shift = exec(expr.shift);
        return isVal(val) && isVal(shift) ? Val(val.val >> shift.val) : Sar(val, shift);
    },

    CallDataLoad: expr => {
        expr.location = exec(expr.location);
        return expr;
    },

    Symbol0: expr => expr,
};

type Table = {
    [N in Expr['name']]: (expr: Extract<Expr, { name: N }>) => Expr;
};

function exec(expr: Expr): Expr {
    return (Exec[expr.name] as (expr: Expr) => Expr)(expr);
}
