import type { Expr, Stmt } from './evm/expr';
import { Not } from './evm/logic';
import type { Revert } from './evm/system';
import type { State } from './state';

export class If {
    readonly name = 'If';
    constructor(
        readonly condition: Expr,
        readonly trueBlock?: Stmt2[],
        readonly falseBlock?: Stmt2[]
    ) {}

    toString() {
        return `(${this.condition})`;
    }
}

export class CallSite {
    readonly name = 'CallSite';

    constructor(readonly selector: string) {}

    toString() {
        return `$${this.selector}();`;
    }
}

export function isRevertBlock(falseBlock: Stmt2[]): falseBlock is [Revert] {
    return (
        falseBlock.length === 1 && 'name' in falseBlock[0] && falseBlock[0].name === 'Revert' //&&
        // falseBlock[0].items !== undefined &&
        // falseBlock[0].items.length === 0
        // || falseCloneTree[0].name === 'INVALID'
    );
}
export class Require {
    readonly name = 'Require';

    constructor(readonly condition: Expr, readonly args: Expr[]) {}

    toString() {
        return `require(${this.condition}, ${this.args.join(', ')});`;
    }
}

// export class Assign {
//     readonly name = 'Asign';
//     constructor(readonly i: number, readonly phi: Phi) {}
//     eval() {
//         return this;
//     }
//     toString() {
//         return `local${this.i} = ${this.phi.toString()};`;
//     }
// }

type Stmt2 = Stmt | If | CallSite | Require;

export function build(state: State<Stmt, Expr>): Stmt2[] {
    const visited = new WeakSet();
    return buildState(state);

    function buildState(state: State<Stmt, Expr>): Stmt2[] {
        if (visited.has(state)) {
            return [];
        }

        visited.add(state);

        const last = state.last!;
        if (last === undefined) return [];

        switch (last.name) {
            case 'Jumpi': {
                const trueBlock = buildState(last.destBranch.state);
                const falseBlock = buildState(last.fallBranch.state);
                return [
                    ...state.stmts.slice(0, -1),
                    ...(isRevertBlock(falseBlock)
                        ? [new Require(last.condition, falseBlock[0].args), ...trueBlock]
                        : [new If(new Not(last.condition), falseBlock), ...trueBlock]),
                ];
            }
            case 'SigCase': {
                const falseBlock = buildState(last.fallBranch.state);
                return [
                    ...state.stmts.slice(0, -1),
                    new If(last.condition, [new CallSite(last.condition.selector)], falseBlock),
                ];
            }
            case 'Jump':
                return [...state.stmts.slice(0, -1), ...buildState(last.destBranch.state)];
            case 'JumpDest':
                return [...state.stmts.slice(0, -1), ...buildState(last.fallBranch.state)];
            default:
                return state.stmts;
        }
    }
}

/**
 *
 * @param stmts
 * @param indentation
 * @returns
 */
export function stringify(stmts: Stmt2[], indentation = 0): string {
    let output = '';
    for (const instruction of stmts) {
        if (instruction instanceof If) {
            const condition = instruction.toString();
            output += ' '.repeat(indentation) + 'if ' + condition + ' {\n';
            output += stringify(instruction.trueBlock!, indentation + 4);
            if (instruction.falseBlock) {
                output += ' '.repeat(indentation) + '} else {\n';
                output += stringify(instruction.falseBlock, indentation + 4);
            }
            output += ' '.repeat(indentation) + '}\n';
            // }
        } else {
            output += ' '.repeat(indentation) + instruction.toString() + '\n';
        }
    }

    return output;
}
