import type { Expr, Inst } from './evm/expr';
import { Not } from './evm/logic';
import type { Revert } from './evm/system';
import { State } from './state';
import type { EVM } from './evm';
import { stringifyEvents } from './evm/log';
import { stringifyMappings, stringifyStructs, stringifyVariables } from './evm/storage';

export class Contract {
    /**
     *
     */
    readonly main: Stmt[];

    /**
     *
     */
    readonly functions: { [hash: string]: TopLevelFunction } = {};

    constructor(readonly evm: EVM) {
        const main = new State<Inst, Expr>();
        evm.run(0, main);
        this.main = build(main);
        for (const [, branch] of evm.functionBranches) {
            evm.run(branch.pc, branch.state);
        }
    }

    decompile(): string {
        let text = '';

        text += stringifyEvents(this.evm.events);
        text += stringifyStructs(this.evm.mappings);
        text += stringifyMappings(this.evm.mappings);
        text += stringifyVariables(this.evm.variables);
        text += stringify(this.main);
        for (const [, branch] of this.evm.functionBranches) {
            text += stringify(build(branch.state));
        }

        // const functions = Object.keys(contract.functions)
        //     .map(functionName =>
        //         stringifyFunction(
        //             functionName,
        //             contract.functions[functionName],
        //             contract.functionHashes
        //         )
        //     )
        //     .join('');
        return text;
    }
}

export class If {
    readonly name = 'If';
    constructor(
        readonly condition: Expr,
        readonly trueBlock?: Stmt[],
        readonly falseBlock?: Stmt[]
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

export function isRevertBlock(falseBlock: Stmt[]): falseBlock is [Revert] {
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

export class TopLevelFunction {
    readonly label: string = '?';
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: any;

    constructor(
        readonly stmts: Stmt[],
        readonly hash: string,
        // readonly gasUsed: number,
        functionHashes: { [s: string]: string }
    ) {
        this.payable = true;
        this.visibility = 'public';
        this.constant = false;
        this.returns = [];
        // this.label = this.hash in functionHashes ? functionHashes[this.hash] : this.hash + '()';
        if (
            this.stmts.length > 0 &&
            this.stmts[0] instanceof Require &&
            this.stmts[0].condition.tag === 'IsZero' &&
            this.stmts[0].condition.value.tag === 'CallValue'
        ) {
            this.payable = false;
            this.stmts.shift();
        }
        if (this.stmts.length === 1 && this.stmts[0].name === 'Return') {
            this.constant = true;
        }
        if (this.hash in functionHashes) {
            const functionName = functionHashes[this.hash].split('(')[0];
            const argumentTypes = functionHashes[this.hash]
                .replace(functionName, '')
                .substr(1)
                .slice(0, -1)
                .split(',');
            if (
                argumentTypes.length > 1 ||
                (argumentTypes.length === 1 && argumentTypes[0] !== '')
            ) {
                // this.stmts.forEach(stmt =>
                // updateCallDataLoad(stmt as unknown as Record<string, Expr>, argumentTypes)
                // );
            }
        }
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

export type Stmt = Inst | If | CallSite | Require;

export function build(state: State<Inst, Expr>): Stmt[] {
    const visited = new WeakSet();
    return buildState(state);

    function buildState(state: State<Inst, Expr>): Stmt[] {
        if (visited.has(state)) {
            return [];
        }

        visited.add(state);

        const last = state.last!;
        if (last === undefined) return [];

        switch (last.name) {
            case 'Jumpi': {
                if (last.evalCond.isVal()) {
                    if (last.evalCond.val === 0n) {
                        return [...state.stmts.slice(0, -1), ...buildState(last.fallBranch.state)];
                    } else {
                        return [...state.stmts.slice(0, -1), ...buildState(last.destBranch.state)];
                    }
                }

                const trueBlock = buildState(last.destBranch.state);
                const falseBlock = buildState(last.fallBranch.state);
                return [
                    ...state.stmts.slice(0, -1),
                    ...(isRevertBlock(falseBlock)
                        ? [new Require(last.cond, falseBlock[0].args), ...trueBlock]
                        : [new If(new Not(last.cond), falseBlock), ...trueBlock]),
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
export function stringify(stmts: Stmt[], indentation = 0): string {
    let text = '';
    for (const stmt of stmts) {
        if (stmt instanceof If) {
            const condition = stmt.toString();
            text += ' '.repeat(indentation) + 'if ' + condition + ' {\n';
            text += stringify(stmt.trueBlock!, indentation + 4);
            if (stmt.falseBlock) {
                text += ' '.repeat(indentation) + '} else {\n';
                text += stringify(stmt.falseBlock, indentation + 4);
            }
            text += ' '.repeat(indentation) + '}\n';
            // }
        } else {
            text += ' '.repeat(indentation) + stmt.toString() + '\n';
        }
    }

    return text;
}

/**
 *
 * @param functionName
 * @param functionInstance
 * @param functionHashes
 * @returns
 */
function stringifyFunction(
    functionName: string,
    functionInstance: TopLevelFunction,
    functionHashes: Contract['functionHashes']
): string {
    let output = '';
    output += 'function ';
    if (functionName in functionHashes) {
        const fullFunction = functionHashes[functionName];
        const fullFunctionName = fullFunction.split('(')[0];
        const fullFunctionArguments = fullFunction
            .replace(fullFunctionName, '')
            .substring(1)
            .slice(0, -1);
        if (fullFunctionArguments) {
            output += fullFunctionName + '(';
            output += fullFunctionArguments
                .split(',')
                .map((a: string, i: number) => a + ' _arg' + i)
                .join(', ');
            output += ')';
        } else {
            output += fullFunction;
        }
    } else {
        output += functionName + '()';
    }
    output += ' ' + functionInstance.visibility;
    if (functionInstance.constant) {
        output += ' view';
    }
    if (functionInstance.payable) {
        output += ' payable';
    }
    if (functionInstance.returns.length > 0) {
        output += ' returns (' + functionInstance.returns.join(', ') + ')';
    }
    output += ' {\n';
    output += stringifyInstructions(functionInstance.stmts, 4);
    output += '}\n\n';
    return output;
}
