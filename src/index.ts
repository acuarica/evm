import type { Expr, Inst } from './evm/expr';
import { Not } from './evm/logic';
import type { Revert } from './evm/system';
import { State } from './state';
import { EVM } from './evm';
import { stringifyEvents } from './evm/log';
import { stringifyMappings, stringifyStructs, stringifyVariables } from './evm/storage';
import { OPCODES } from './opcode';

/**
 *
 */
export class Contract {
    /**
     *
     */
    readonly evm: EVM;

    /**
     *
     */
    readonly main: Stmt[];

    /**
     *
     */
    readonly functions: { [selector: string]: PublicFunction } = {};

    constructor(bytecode: string) {
        this.evm = new EVM(bytecode);
        const main = new State<Inst, Expr>();
        this.evm.run(0, main);
        this.main = build(main);
        for (const [selector, branch] of this.evm.functionBranches) {
            this.evm.run(branch.pc, branch.state);
            this.functions[selector] = new PublicFunction(build(branch.state), selector);
        }
    }

    get metadata(): EVM['metadata'] {
        return this.evm.metadata;
    }

    /**
     *
     */
    chunks(): { pcstart: number; pcend: number; states?: State<Inst, Expr>[] }[] {
        let lastPc = 0;

        const result = [];
        const pcs = [...this.evm.chunks.keys()];
        pcs.sort((a, b) => a - b);
        for (const pc of pcs) {
            const chunk = this.evm.chunks.get(pc)!;
            if (lastPc !== pc) {
                result.push({ pcstart: lastPc, pcend: pc });
            }
            lastPc = chunk.pcend;
            result.push({ pcstart: pc, pcend: chunk.pcend, states: chunk.states });
        }

        if (lastPc !== this.evm.opcodes.length) {
            result.push({ pcstart: lastPc, pcend: this.evm.opcodes.length });
        }

        return result;
    }

    /**
     *
     * @returns
     */
    getFunctions(): string[] {
        return Object.values(this.functions).flatMap(fn =>
            fn.label === undefined ? [] : [fn.label]
        );
    }

    /**
     *
     * @returns
     */
    getEvents(): string[] {
        return Object.values(this.evm.events).flatMap(event =>
            event.sig === undefined ? [] : [event.sig]
        );
    }

    // getABI() {
    //     return Object.values(this.contract).map(fn => {
    //         return {
    //             type: 'function',
    //             name: fn.label.split('(')[0],
    //             payable: fn.payable,
    //             constant: fn.constant,
    //         };
    //     });
    // }

    /**
     * https://eips.ethereum.org/EIPS/eip-165
     *
     * @returns
     */
    isERC165(): boolean {
        /**
         * `bytes4(keccak256('supportsInterface(bytes4)'))`
         */
        const selector = '01ffc9a7';
        return this.evm.functionBranches.has(selector);
    }

    /**
     *
     * @returns
     */
    decompile(): string {
        let text = '';

        text += stringifyEvents(this.evm.events);
        text += stringifyStructs(this.evm.mappings);
        text += stringifyMappings(this.evm.mappings);
        text += stringifyVariables(this.evm.variables);
        text += stringify(this.main);
        for (const [, fn] of Object.entries(this.functions)) {
            text += stringifyFunction(fn);
        }

        return text;
    }

    /**
     * Migrated from old codebase.
     * Evaluate if it makes sense to keep it.
     *
     * @param opcode
     * @returns
     */
    containsOpcode(opcode: number | string): boolean {
        const HALTS: number[] = [
            OPCODES.STOP,
            OPCODES.RETURN,
            OPCODES.REVERT,
            OPCODES.INVALID,
            OPCODES.SELFDESTRUCT,
        ];
        let halted = false;
        if (typeof opcode === 'string' && opcode in OPCODES) {
            opcode = OPCODES[opcode as keyof typeof OPCODES];
        } else if (typeof opcode === 'string') {
            throw new Error('Invalid opcode provided');
        }
        for (let index = 0; index < this.evm.opcodes.length; index++) {
            const currentOpcode = this.evm.opcodes[index].opcode;
            if (currentOpcode === opcode && !halted) {
                return true;
            } else if (currentOpcode === OPCODES.JUMPDEST) {
                halted = false;
            } else if (HALTS.includes(currentOpcode)) {
                halted = true;
            }
        }
        return false;

        // function fromHex(str: string): Uint8Array {
        //     const buffer = new Uint8Array(str.length / 2);
        //     for (let i = 0; i < buffer.length; i++) {
        //         buffer[i] = parseInt(str.substr(i * 2, 2), 16);
        //     }
        //     return buffer;
        // }
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

export class PublicFunction {
    /**
     *
     */
    label: string | undefined = undefined;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: [] = [];

    constructor(
        readonly stmts: Stmt[],
        readonly selector: string // readonly gasUsed: number, // functionHashes: { [s: string]: string }
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
        // if (this.selector in functionHashes) {
        // const functionName = functionHashes[this.selector].split('(')[0];
        // const argumentTypes = functionHashes[this.selector] .replace(functionName, '') .substr(1) .slice(0, -1) .split(',');
        // if ( argumentTypes.length > 1 || (argumentTypes.length === 1 && argumentTypes[0] !== '')) {
        // this.stmts.forEach(stmt =>
        // updateCallDataLoad(stmt as unknown as Record<string, Expr>, argumentTypes)
        // );
        // }
        // }
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

        for (let i = 0; i < state.stmts.length; i++) {
            state.stmts[i] = state.stmts[i].eval();
        }

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
                        ? [
                              new Require(
                                  last.cond.eval(),
                                  falseBlock[0].args.map(e => e.eval())
                              ),
                              ...trueBlock,
                          ]
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
 * @param fn
 * @param functionHashes
 * @returns
 */
function stringifyFunction(fn: PublicFunction): string {
    let output = '';
    output += 'function ';
    if (fn.label !== undefined) {
        const fullFunction = fn.label;
        const fullFunctionName = fullFunction.split('(')[0];
        const fullFunctionArguments = fullFunction
            .replace(fullFunctionName, '')
            .substring(1)
            .slice(0, -1);
        if (fullFunctionArguments) {
            output += fullFunctionName + '(';
            output += fullFunctionArguments
                .split(',')
                .map((a: string, i: number) => `${a} _arg${i}`)
                .join(', ');
            output += ')';
        } else {
            output += fullFunction;
        }
    } else {
        output += fn.selector + '()';
    }
    output += ' ' + fn.visibility;
    if (fn.constant) {
        output += ' view';
    }
    if (fn.payable) {
        output += ' payable';
    }
    if (fn.returns.length > 0) {
        output += ` returns (${fn.returns.join(', ')})`;
    }
    output += ' {\n';
    output += stringify(fn.stmts, 4);
    output += '}\n\n';
    return output;
}
