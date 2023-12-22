import { type Expr, type Inst, Throw, type Val } from './ast';
import { CallSite, If, Require, type Stmt } from './ast';
import { Not } from './ast/alu';
import type { Return, Revert } from './ast/system';
import type { IEvents } from './ast/log';
import { type SLoad, Variable, type MappingLoad, type IStore } from './ast/storage';
import type { Type } from './type';
import { State } from './state';
import { EVM } from './evm';
import ERCs from './ercs';
import { STEP, type ISelectorBranches } from './step';
import type { Metadata } from './metadata';

/**
 *
 */
export const ERCIds = Object.keys(ERCs);

/**
 *
 */
export class Contract {
    /**
     *
     */
    // readonly evm: EVM;

    readonly metadata: Metadata | undefined;

    /**
     *
     */
    readonly main: Stmt[];

    readonly events: IEvents = {};
    readonly variables: IStore['variables'] = {};
    readonly mappings: IStore['mappings'] = {};
    readonly functionBranches: ISelectorBranches = new Map();
    readonly errors: Throw[];

    /**
     *
     */
    readonly functions: { [selector: string]: PublicFunction } = {};

    readonly payable: boolean;

    /**
     *
     * @param bytecode the bytecode to analyze in hexadecimal format.
     */
    constructor(readonly bytecode: string, _insts = {}) {
        const evm = new EVM(bytecode, STEP(
            this.events,
            this.variables,
            this.mappings,
            this.functionBranches
        ));
        const main = new State<Inst, Expr>();
        evm.run(0, main);
        this.main = build(main);

        this.payable = !requiresNoValue(this.main);

        for (const [selector, branch] of evm.step.functionBranches) {
            evm.run(branch.pc, branch.state);
            this.functions[selector] = new PublicFunction(this, build(branch.state), selector);
        }

        this.metadata = evm.metadata;
        this.errors = evm.errors;
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
        return Object.values(this.events).flatMap(event =>
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
     * https://eips.ethereum.org/EIPS/eip-20
     * https://eips.ethereum.org/EIPS/eip-20
     * https://eips.ethereum.org/EIPS/eip-721
     *
     * @param ercid
     * @returns
     */
    isERC(ercid: (typeof ERCIds)[number], checkEvents = true): boolean {
        return (
            ERCs[ercid].selectors.every(s => this.functionBranches.has(s)) &&
            (!checkEvents || ERCs[ercid].topics.every(t => t in this.events))
        );
    }
}

export function isRevertBlock(falseBlock: Stmt[]): falseBlock is [...Inst[], Revert] {
    return (
        falseBlock.length >= 1 &&
        falseBlock.slice(0, -1).every(stmt => stmt.name === 'Local' || stmt.name === 'MStore') &&
        falseBlock.at(-1)!.name === 'Revert'
    );
}

export class PublicFunction {
    /**
     *
     */
    private _label: string | undefined = undefined;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: string[] = [];

    constructor(
        readonly contract: Contract,
        readonly stmts: Stmt[],
        readonly selector: string // readonly gasUsed: number, // functionHashes: { [s: string]: string }
    ) {
        this.visibility = 'public';
        this.constant = false;
        // this.label = this.hash in functionHashes ? functionHashes[this.hash] : this.hash + '()';

        if (requiresNoValue(this.stmts)) {
            this.payable = false;
            this.stmts.shift();
        } else if (!contract.payable) {
            this.payable = false;
        } else {
            this.payable = true;
        }
        if (this.stmts.length === 1 && this.stmts[0].name === 'Return') {
            this.constant = true;
        }

        const returns: Expr[][] = [];
        PublicFunction.findReturns(stmts, returns);
        if (
            returns.length > 0 &&
            returns.every(
                args =>
                    args.length === returns[0].length &&
                    args.map(arg => arg.type).join('') === returns[0].map(arg => arg.type).join('')
            )
        ) {
            returns[0].forEach(arg => {
                if (arg.isVal()) {
                    this.returns.push('uint256');
                } else if (arg.type) {
                    this.returns.push(arg.type);
                } else {
                    this.returns.push('unknown');
                }
            });
        } else if (returns.length > 0) {
            this.returns.push('<unknown>');
        }
    }

    get label(): string | undefined {
        return this._label;
    }

    set label(value: string | undefined) {
        this._label = value;
        if (value !== undefined) {
            const functionName = value.split('(')[0];

            if (this.isGetter()) {
                const location = this.stmts[0].args[0].location.val.toString();
                const variable = this.contract.variables[location];
                this.contract.variables[this.selector] = new Variable(
                    functionName,
                    variable ? variable.types : []
                );
            }

            if (this.isMappingGetter()) {
                const location = this.stmts[0].args[0].location;
                this.contract.mappings[location].name = functionName;
            }

            const paramTypes = value.replace(functionName, '').slice(1, -1).split(',');
            if (paramTypes.length > 1 || (paramTypes.length === 1 && paramTypes[0] !== '')) {
                this.stmts.forEach(stmt =>
                    PublicFunction.patchCallDataLoad(
                        stmt as unknown as Record<string, Expr>,
                        paramTypes as Type[]
                    )
                );
            }
        }
    }

    private isGetter(): this is { stmts: [Return & { args: [SLoad & { location: Val }] }] } {
        const exit = this.stmts[0];
        return (
            this.stmts.length === 1 &&
            exit.name === 'Return' &&
            exit.args !== undefined &&
            exit.args.length === 1 &&
            exit.args[0].tag === 'SLoad' &&
            exit.args[0].location.isVal()
        );
    }

    private isMappingGetter(): this is { stmts: [Return & { args: MappingLoad[] }] } {
        const exit = this.stmts[0];
        return (
            this.stmts.length === 1 &&
            exit.name === 'Return' &&
            exit.args !== undefined &&
            exit.args.every(arg => arg.tag === 'MappingLoad')
        );
    }

    private static findReturns(stmts: Stmt[], returns: Expr[][]) {
        for (const stmt of stmts) {
            if (stmt.name === 'Return' && stmt.args && stmt.args.length > 0) {
                returns.push(stmt.args);
            } else if (stmt.name === 'If') {
                [stmt.trueBlock, stmt.falseBlock].forEach(stmts => {
                    if (stmts !== undefined) {
                        PublicFunction.findReturns(stmts, returns);
                    }
                });
            }
        }
    }

    private static patchCallDataLoad(stmtOrExpr: Record<string, Expr>, paramTypes: Type[]) {
        for (const propKey in stmtOrExpr) {
            if (propKey === 'mappings') continue;

            if (Object.prototype.hasOwnProperty.call(stmtOrExpr, propKey)) {
                const expr = stmtOrExpr[propKey];
                if (expr && expr.tag === 'CallDataLoad' && expr.location.isVal()) {
                    const argNumber = Number((expr.location.val - 4n) / 32n);
                    expr.type = paramTypes[argNumber];
                }
                if (
                    typeof expr === 'object' &&
                    !(expr instanceof Variable) &&
                    !(expr instanceof Throw)
                ) {
                    PublicFunction.patchCallDataLoad(
                        expr as unknown as Record<string, Expr>,
                        paramTypes
                    );
                }
            }
        }
    }
}

export function build(state: State<Inst, Expr>): Stmt[] {
    const visited = new WeakSet();
    const res = buildState(state);
    // mem(res);
    return res;

    function buildState(state: State<Inst, Expr>): Stmt[] {
        if (visited.has(state)) {
            return [];
        }

        visited.add(state);

        const last = state.last!;
        if (last === undefined) return [];

        for (let i = 0; i < state.stmts.length; i++) {
            // state.stmts[i] = state.stmts[i].eval();
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
                                ((falseBlock.at(-1) as Revert).args ?? []).map(e => e.eval())
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

export function reduce(stmts: Inst[]): Stmt[] {
    const result = [];
    for (const stmt of stmts) {
        if (stmt.name !== 'Local' || stmt.local.nrefs > 0) {
            result.push(stmt);
        }
    }

    return result;
}

function requiresNoValue(stmts: Stmt[]): boolean {
    return (
        stmts.length > 0 &&
        stmts[0] instanceof Require &&
        stmts[0].condition.tag === 'IsZero' &&
        stmts[0].condition.value.tag === 'CallValue'
    );
}

export * from './metadata';
export * from './state';
export * from './step';
export * from './type';
export * from './evm';
export * from './sol';
export * from './yul';
