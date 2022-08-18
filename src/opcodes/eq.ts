import { EVM, Operand } from '../evm';
import { CallDataLoad } from '../inst/info';
import { Shr } from '../inst/logic';
import { Div } from '../inst/math';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class SIG {
    readonly name = 'SIG';
    readonly wrapped = false;

    constructor(readonly hash: string) {}

    toString = () => `msg.sig == ${this.hash}`;
}

export class EQ {
    readonly name = 'EQ';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} == ${stringify(this.right)}`;
}

function fromSHRsig(left: Operand, right: Operand, cc: () => SIG | EQ): SIG | EQ {
    if (
        typeof left === 'bigint' &&
        right instanceof Shr &&
        typeof right.shift === 'bigint' &&
        right.shift === 0xe0n &&
        right.value instanceof CallDataLoad &&
        right.value.location === 0n
    ) {
        return new SIG(left.toString(16).padStart(8, '0'));
    }
    return cc();
}

function fromDIVEXPsig(left: Operand, right: Operand, cc: () => SIG | EQ): SIG | EQ {
    if (typeof left === 'bigint' && right instanceof Div && typeof right.right === 'bigint') {
        left = left * right.right;
        right = right.left;

        // /^[0]+$/.test(left.toString(16).substring(8)) &&
        if (left % (1n << 0xe0n) === 0n && right instanceof CallDataLoad && right.location === 0n) {
            return new SIG(
                left
                    .toString(16)
                    .substring(0, 8 - (64 - left.toString(16).length))
                    .padStart(8, '0')
            );
        }
    }

    return cc();
}

export default (_opcode: Opcode, { stack }: EVM) => {
    const left = stack.pop();
    const right = stack.pop();

    stack.push(
        typeof left === 'bigint' && typeof right === 'bigint'
            ? left === right
                ? 1n
                : 0n
            : fromDIVEXPsig(left, right, () =>
                  fromDIVEXPsig(right, left, () =>
                      fromSHRsig(left, right, () =>
                          fromSHRsig(right, left, () => new EQ(left, right))
                      )
                  )
              )
    );
};
