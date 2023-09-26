/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import type { Stmt } from '.';
import { type Expr, type Inst } from './evm/expr';
// import { Log } from './evm/log';
// import { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Xor } from './evm/logic';
// import { Add, Div, Exp, Mod, Mul, Sub } from './evm/math';

// export interface Yul {
//     /**
//      * Returns the Yul string representation of `this` `Expr`ession.
//      *
//      * https://docs.soliditylang.org/en/latest/yul.html
//      */
//     yul(): string;
// }

// declare module './evm/expr' {
//     interface Val extends Yul { }
// }

// declare module './evm/math' {
//     interface Add extends Yul { }
//     interface Mul extends Yul { }
//     interface Sub extends Yul { }
//     interface Div extends Yul { }
//     interface Mod extends Yul { }
//     interface Exp extends Yul { }
// }

// declare module './evm/logic' {
//     interface Lt extends Yul { }
//     interface Gt extends Yul { }
//     interface Eq extends Yul { }
//     interface IsZero extends Yul { }
//     interface And extends Yul { }
//     interface Or extends Yul { }
//     interface Xor extends Yul { }
//     interface Not extends Yul { }
//     interface Byte extends Yul { }
//     interface Shl extends Yul { }
//     interface Shr extends Yul { }
//     interface Sar extends Yul { }
// }

// declare module './evm/log' {
//     interface Log extends Yul { }
// }

// const bin = (sym: string) =>
//     function (this: Add) {
//         return `${sym}(${(this.left as any).yul()}, ${(this.right as any).yul()})`;
//     };

// const unary = (sym: string) =>
//     function (this: IsZero) {
//         return `${sym}(${(this.value as any).yul()})`;
//     };

// const shift = (sym: string) =>
//     function (this: Shl) {
//         return `${sym}(${(this.value as any).yul()}, ${(this.shift as any).yul()})`;
//     };

// const A0 = {
//     Val: (expr: Val) => `${expr.val}`,
//     Add: (expr: Add) => bin('add').call(expr),
// };

// Val.prototype.yul = function () {
//     return `${this.val}`;
// };

// Add.prototype.yul = bin('add');
// Mul.prototype.yul = bin('mul');
// Sub.prototype.yul = bin('sub');
// Div.prototype.yul = bin('div');
// Mod.prototype.yul = bin('mod');
// Exp.prototype.yul = bin('exp');
// Lt.prototype.yul = bin('exp');
// Gt.prototype.yul = bin('exp');
// Eq.prototype.yul = bin('exp');
// IsZero.prototype.yul = unary('iszero');
// And.prototype.yul = bin('exp');
// Or.prototype.yul = bin('exp');
// Xor.prototype.yul = bin('exp');
// Not.prototype.yul = unary('not');
// Byte.prototype.yul = bin('exp');
// Shl.prototype.yul = shift('shl');
// Shr.prototype.yul = shift('shr');
// Sar.prototype.yul = shift('sar');

// Log.prototype.yul = function () {
//     return `log${this.topics.length}(${this.topics.map(e => (e as any).yul()).join(', ')})`;
// };

export namespace expr {
    export function yul(expr: Expr): string {
        switch (expr.tag) {
            case 'Val':
                return `${expr.val}`;
            case 'Add':
            case 'Mul':
            case 'Sub':
            case 'Div':
            case 'Mod':
            case 'Exp':
            case 'Lt':
            case 'Gt':
            case 'Eq':
            case 'And':
            case 'Or':
            case 'Xor':
                return `${expr.tag.toLowerCase()}(${yul(expr.left)}, ${yul(expr.right)})`;
            case 'IsZero':
            case 'Not':
                return `${expr.tag.toLowerCase()}(${yul(expr.value)})`;
            case 'Byte': {
                throw new Error('Not implemented yet: "Byte" case');
            }
            case 'Shl':
            case 'Shr':
            case 'Sar':
                return `${expr.tag.toLowerCase()}(${yul(expr.value)}, ${yul(expr.shift)})`;
            case 'Sig': {
                throw new Error('Not implemented yet: "Sig" case');
            }
            case 'CallValue':
                return `callvalue()`;
            case 'CallDataLoad':
                return `calldataload(${yul(expr.location)})`;
            case 'Prop': {
                throw new Error('Not implemented yet: "Prop" case');
            }
            case 'Fn': {
                throw new Error('Not implemented yet: "Fn" case');
            }
            case 'DataCopy': {
                throw new Error('Not implemented yet: "DataCopy" case');
            }
            case 'MLoad': {
                throw new Error('Not implemented yet: "MLoad" case');
            }
            case 'Sha3': {
                throw new Error('Not implemented yet: "Sha3" case');
            }
            case 'Create': {
                throw new Error('Not implemented yet: "Create" case');
            }
            case 'Call': {
                throw new Error('Not implemented yet: "Call" case');
            }
            case 'ReturnData': {
                throw new Error('Not implemented yet: "ReturnData" case');
            }
            case 'CallCode': {
                throw new Error('Not implemented yet: "CallCode" case');
            }
            case 'Create2': {
                throw new Error('Not implemented yet: "Create2" case');
            }
            case 'StaticCall': {
                throw new Error('Not implemented yet: "StaticCall" case');
            }
            case 'DelegateCall': {
                throw new Error('Not implemented yet: "DelegateCall" case');
            }
            case 'SLoad': {
                throw new Error('Not implemented yet: "SLoad" case');
            }
            case 'MappingLoad': {
                throw new Error('Not implemented yet: "MappingLoad" case');
            }
        }
    }
}

export namespace inst {
    export function yul(inst: Inst): string {
        switch (inst.name) {
            case 'Log':
                return `log${inst.topics.length}(${inst.mem.offset} ${inst.topics
                    .map(expr.yul)
                    .join(', ')})`;
            case 'MStore': {
                throw new Error('Not implemented yet: "MStore" case');
            }
            case 'Stop':
                return `stop()`;
            case 'Return': {
                throw new Error('Not implemented yet: "Return" case');
            }
            case 'Revert': {
                throw new Error('Not implemented yet: "Revert" case');
            }
            case 'SelfDestruct':
                return `selfdestruct(${expr.yul(inst.address)})`;
            case 'Invalid': {
                throw new Error('Not implemented yet: "Invalid" case');
            }
            case 'Jump': {
                throw new Error('Not implemented yet: "Jump" case');
            }
            case 'Jumpi': {
                throw new Error('Not implemented yet: "Jumpi" case');
            }
            case 'JumpDest': {
                throw new Error('Not implemented yet: "JumpDest" case');
            }
            case 'SigCase': {
                throw new Error('Not implemented yet: "SigCase" case');
            }
            case 'SStore': {
                throw new Error('Not implemented yet: "SStore" case');
            }
            case 'MappingStore': {
                throw new Error('Not implemented yet: "MappingStore" case');
            }
            case 'Throw': {
                throw new Error('Not implemented yet: "Throw" case');
            }
        }
    }
}

// export function yul(stmt: Stmt): string {
//     return inst.map(inst.yul).join('\n');
// }
