import {
    CallSite,
    CallValue,
    evalExpr,
    Expr,
    If,
    isBigInt,
    IsZero,
    Jump,
    JumpDest,
    Jumpi,
    Require,
    Return,
    Revert,
    SigCase,
    SLoad,
    Stmt,
} from './ast';
import { ControlFlowGraph } from './cfg';
import { getDispatch } from './inst';
import { Opcode } from './opcode';
import { State } from './state';
import { assert } from './error';

/**
 *
 */
export class Contract {
    /**
     *
     */
    readonly main: { cfg: ControlFlowGraph; stmts: Stmt[] };

    /**
     *
     */
    readonly functions: { [hash: string]: TopLevelFunction } = {};

    /**
     *
     */
    readonly events: { [topic: string]: { label?: string; indexedCount: number } } = {};

    /**
     *
     */
    readonly variables: { [key: string]: Variable } = {};

    /**
     *
     */
    readonly mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    } = {};

    /**
     *
     * @param opcodes
     * @param functionHashes
     * @param eventHashes
     */
    constructor(
        opcodes: Opcode[],
        /**
         *
         */
        readonly functionHashes: { [hash: string]: string },
        /**
         *
         */
        readonly eventHashes: { [hash: string]: string }
    ) {
        const dispatch = getDispatch(this);
        this.main = (cfg => ({ cfg, stmts: transform(cfg) }))(
            new ControlFlowGraph(opcodes, dispatch, { pc: 0, state: new State() })
        );

        for (const branch of this.main.cfg.functionBranches) {
            const cfg = new ControlFlowGraph(opcodes, dispatch, branch);
            const fn = new TopLevelFunction(cfg, branch.hash, functionHashes);
            assert(cfg.functionBranches.length === 0);
            this.functions[branch.hash] = fn;
            if (branch.hash in functionHashes && isGetter(fn.stmts)) {
                const fullFunction = functionHashes[branch.hash];
                this.variables[branch.hash] = new Variable(fullFunction.split('(')[0], []);
            }
        }
    }

    getFunction(signature: string): TopLevelFunction | undefined {
        for (const fn of Object.values(this.functions)) {
            if (fn.label === signature) {
                return fn;
            }
        }
        return undefined;
    }
}

export class Variable {
    constructor(public label: string | undefined, readonly types: any[]) {}
}

export class TopLevelFunction {
    readonly stmts: Stmt[];
    readonly label: string;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: any;

    constructor(
        readonly cfg: ControlFlowGraph,
        readonly hash: string,
        // readonly gasUsed: number,
        functionHashes: { [s: string]: string }
    ) {
        this.stmts = transform(cfg);
        this.payable = true;
        this.visibility = 'public';
        this.constant = true;
        this.returns = [];
        this.label = this.hash in functionHashes ? functionHashes[this.hash] : this.hash + '()';
        if (
            this.stmts.length > 0 &&
            this.stmts[0] instanceof Require &&
            this.stmts[0].condition instanceof IsZero &&
            this.stmts[0].condition.value instanceof CallValue
        ) {
            this.payable = false;
            this.stmts.shift();
        }
        if (this.stmts.length === 1 && this.stmts[0] instanceof Return) {
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
                this.stmts.forEach(item => updateCallDataLoad(item, argumentTypes));
            }
        }
        const returns: any = [];
        this.stmts.forEach(item => {
            const deepReturns = findReturns(item);
            if (deepReturns.length > 0) {
                returns.push(...deepReturns);
            }
        });
        if (
            returns.length > 0 &&
            returns.every(
                (returnItem: any) =>
                    returnItem.length === returns[0].length &&
                    returnItem.map((item: any) => item.type).join('') ===
                        returns[0].map((item: any) => item.type).join('')
            )
        ) {
            returns[0].forEach((item: any) => {
                if (isBigInt(item)) {
                    this.returns.push('uint256');
                } else if (item.type) {
                    this.returns.push(item.type);
                } else {
                    this.returns.push('unknown');
                }
            });
        } else if (returns.length > 0) {
            this.returns.push('<unknown>');
        }
    }
}

const updateCallDataLoad = (item: any, types: any) => {
    for (const i in item) {
        if (Object.prototype.hasOwnProperty.call(item, i)) {
            if (
                typeof item[i] === 'object' &&
                item[i].name === 'CALLDATALOAD' &&
                isBigInt(item[i].location)
            ) {
                const argNumber = ((item[i].location - 4n) / 32n).toString();
                item[i].type = types[argNumber];
            }
            if (typeof item[i] === 'object') {
                updateCallDataLoad(item[i], types);
            }
        }
    }
};

const findReturns = (item: any) => {
    const returns = [];
    for (const i in item) {
        if (Object.prototype.hasOwnProperty.call(item, i)) {
            if (
                typeof item[i] === 'object' &&
                item[i] instanceof Return &&
                item[i].items &&
                item[i].items.length > 0
            ) {
                returns.push(item[i].items);
            }
            if (typeof item[i] === 'object') {
                const deepReturns: any = findReturns(item[i]);
                if (deepReturns.length > 0) {
                    returns.push(...deepReturns);
                }
            }
        }
    }
    return returns;
};

function transform({ blocks, entry }: ControlFlowGraph): Stmt[] {
    const pcs: { [key: string]: true } = {};
    return transformBlock(entry);

    function transformBlock(key: string): Stmt[] {
        if (key in pcs) {
            return blocks[key].stmts;
        }

        pcs[key] = true;

        const block = blocks[key];
        assert(block !== undefined, key, Object.keys(blocks));

        for (const i in block.stmts) {
            block.stmts[i] = block.stmts[i].eval();
        }

        const last = block.stmts.at(-1);
        if (last instanceof Jumpi) {
            const trueBlock = transformBlock(last.destBranch.key);
            const falseBlock = transformBlock(last.fallBranch.key);
            return [
                ...block.stmts.slice(0, -1),
                ...(isRevertBlock(falseBlock)
                    ? [new Require(evalExpr(last.condition), falseBlock[0].items), ...trueBlock]
                    : [new If(evalExpr(last.condition), trueBlock, falseBlock)]),
            ];
        } else if (last instanceof SigCase) {
            const falseBlock = transformBlock(last.fallBranch.key);
            return [
                ...block.stmts.slice(0, -1),
                new If(last.condition, [new CallSite(last.condition.hash)], falseBlock),
            ];
        } else if (last instanceof Jump) {
            // delete pcs[last.destBranch!];
            return [...block.stmts.slice(0, -1), ...transformBlock(last.destBranch.key)];
        } else if (last instanceof JumpDest) {
            return [...block.stmts.slice(0, -1), ...transformBlock(last.fallBranch.key)];
        }

        return block.stmts;
    }
}

export function isRevertBlock(falseBlock: Stmt[]): falseBlock is [Revert] {
    return (
        falseBlock.length === 1 && 'name' in falseBlock[0] && falseBlock[0].name === 'REVERT' //&&
        // falseBlock[0].items !== undefined &&
        // falseBlock[0].items.length === 0
        // || falseCloneTree[0].name === 'INVALID'
    );
}

function isGetter(stmts: Stmt[]) {
    const exit = stmts[0];
    return (
        stmts.length === 1 &&
        // stmts[0] instanceof MStore &&
        exit instanceof Return &&
        exit.args.length === 1 &&
        exit.args[0] instanceof SLoad &&
        isBigInt(exit.args[0].location)
    );
}
