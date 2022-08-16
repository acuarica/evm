import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

const updateCallDataLoad = (item: any, types: any) => {
    for (const i in item) {
        if (Object.prototype.hasOwnProperty.call(item, i)) {
            if (
                typeof item[i] === 'object' &&
                item[i].name === 'CALLDATALOAD' &&
                typeof item[i].location === 'bigint'
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
                item[i].name === 'RETURN' &&
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

export class TopLevelFunction {
    readonly name: string;
    readonly type?: string;
    readonly label: string;
    readonly hash: any;
    readonly gasUsed: number;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly items: any;
    readonly returns: any;

    constructor(items: any, hash: any, gasUsed: number, functionHashes: { [s: string]: string }) {
        this.name = 'Function';
        this.hash = hash;
        this.gasUsed = gasUsed;
        this.items = items;
        this.payable = true;
        this.visibility = 'public';
        this.constant = false;
        this.returns = [];
        if (this.hash in functionHashes) {
            this.label = (functionHashes as any)[this.hash];
        } else {
            this.label = this.hash + '()';
        }
        if (
            this.items.length > 0 &&
            this.items[0] instanceof REQUIRE &&
            this.items[0].condition.name === 'ISZERO' &&
            this.items[0].condition.item.name === 'CALLVALUE'
        ) {
            this.payable = false;
            this.items.shift();
        }
        if (this.items.length === 1 && this.items[0].name === 'RETURN') {
            this.constant = true;
        }
        if (this.hash in functionHashes) {
            const functionName = (functionHashes as any)[this.hash].split('(')[0];
            const argumentTypes = (functionHashes as any)[this.hash]
                .replace(functionName, '')
                .substr(1)
                .slice(0, -1)
                .split(',');
            if (
                argumentTypes.length > 1 ||
                (argumentTypes.length === 1 && argumentTypes[0] !== '')
            ) {
                this.items.forEach((item: any) => updateCallDataLoad(item, argumentTypes));
            }
        }
        const returns: any = [];
        this.items.forEach((item: any) => {
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
                if (typeof item === 'bigint') {
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

export class Variable {
    readonly name: string;
    readonly label: string | false;
    readonly types: any;

    constructor(label: string | false, types: any) {
        this.name = 'Variable';
        this.label = label;
        this.types = types;
    }
}

export class REQUIRE {
    readonly name = 'REQUIRE';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly condition: any) {}

    toString() {
        return 'require(' + stringify(this.condition) + ');';
    }
}

export class JUMPI {
    readonly name = 'JUMPI';
    readonly type?: string;
    readonly wrapped = true;
    readonly valid: boolean;
    readonly true?: any;
    readonly false?: any;
    readonly payable?: boolean;

    constructor(
        readonly condition: any,
        readonly location: any,
        ifTrue?: any,
        ifFalse?: any,
        skipped?: boolean
    ) {
        if (skipped) {
            this.valid = true;
        } else if (ifTrue && ifFalse) {
            this.valid = true;
            this.true = ifTrue;
            this.false = ifFalse;
            if (
                this.true.length >= 1 &&
                this.true[0] instanceof REQUIRE &&
                this.true[0].condition.name === 'ISZERO' &&
                this.true[0].condition.item.name === 'CALLVALUE'
            ) {
                this.payable = false;
                this.true.shift();
            } else {
                this.payable = true;
            }
        } else {
            this.valid = false;
        }
    }

    toString() {
        if (this.valid && this.true && this.false) {
            return stringify(this.condition);
        } else if (this.valid) {
            return 'if' + stringify(this.condition) + ' goto(' + stringify(this.location) + ');';
        } else {
            return 'revert("Bad jump destination");';
        }
    }
}

export default (opcode: Opcode, state: EVM): void => {
    const jumpLocation = state.stack.pop();
    const jumpCondition = state.stack.pop();
    const opcodes = state.getOpcodes();
    if (typeof jumpLocation !== 'bigint') {
        state.halted = true;
        state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
    } else {
        const jumpLocationData = opcodes.find((o: any) => o.pc === Number(jumpLocation));
        if (!jumpLocationData || jumpLocationData.name !== 'JUMPDEST') {
            //state.halted = true;
            //state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
            state.instructions.push(new REQUIRE(jumpCondition));
        } else if (typeof jumpCondition === 'bigint') {
            const jumpIndex = opcodes.indexOf(jumpLocationData);
            if (
                jumpIndex >= 0 &&
                jumpCondition !== 0n &&
                !(opcode.pc + ':' + Number(jumpLocation) in state.jumps)
            ) {
                state.jumps[opcode.pc + ':' + Number(jumpLocation)] = true;
                state.pc = jumpIndex;
            }
        } else if (
            !(opcode.pc + ':' + Number(jumpLocation) in state.jumps) &&
            jumpCondition.name === 'SIG'
        ) {
            const jumpIndex = opcodes.indexOf(jumpLocationData);
            if (jumpIndex >= 0) {
                const functionClone: any = state.clone();
                functionClone.pc = jumpIndex;
                const functionCloneTree = functionClone.parse();
                state.functions[jumpCondition.hash] = new TopLevelFunction(
                    functionCloneTree,
                    jumpCondition.hash,
                    functionClone.gasUsed,
                    state.functionHashes
                );
                if (
                    jumpCondition.hash in state.functionHashes &&
                    functionCloneTree.length === 1 &&
                    functionCloneTree[0].name === 'RETURN' &&
                    functionCloneTree[0].items.every((item: any) => item.name === 'MappingLoad')
                ) {
                    functionCloneTree[0].items.forEach((item: any) => {
                        const fullFunction = (state.functionHashes as any)[jumpCondition.hash];
                        state.mappings[item.location].name = fullFunction.split('(')[0];
                        if (
                            item.structlocation &&
                            !state.mappings[item.location].structs.includes(item.structlocation)
                        ) {
                            state.mappings[item.location].structs.push(item.structlocation);
                        }
                    });
                    delete state.functions[jumpCondition.hash];
                } else if (
                    jumpCondition.hash in state.functionHashes &&
                    state.functions[jumpCondition.hash].items.length === 1 &&
                    state.functions[jumpCondition.hash].items[0].name === 'RETURN' &&
                    state.functions[jumpCondition.hash].items[0].items.length === 1 &&
                    state.functions[jumpCondition.hash].items[0].items[0].name === 'SLOAD' &&
                    typeof state.functions[jumpCondition.hash].items[0].items[0].location ===
                        'bigint'
                ) {
                    if (
                        !(
                            state.functions[jumpCondition.hash].items[0].items[0].location in
                            state.variables
                        )
                    ) {
                        const fullFunction = (state.functionHashes as any)[jumpCondition.hash];
                        state.variables[
                            state.functions[jumpCondition.hash].items[0].items[0].location
                        ] = new Variable(fullFunction.split('(')[0], []);
                        delete state.functions[jumpCondition.hash];
                    } else {
                        const fullFunction = (state.functionHashes as any)[jumpCondition.hash];
                        state.variables[
                            state.functions[jumpCondition.hash].items[0].items[0].location
                        ].label = fullFunction.split('(')[0];
                        delete state.functions[jumpCondition.hash];
                    }
                }
            }
        } else if (
            !(opcode.pc + ':' + Number(jumpLocation) in state.jumps) &&
            ((jumpCondition.name === 'LT' &&
                jumpCondition.left.name === 'CALLDATASIZE' &&
                typeof jumpCondition.right === 'bigint' &&
                jumpCondition.right === 4n) ||
                (jumpCondition.name === 'ISZERO' && jumpCondition.value.name === 'CALLDATASIZE'))
        ) {
            const jumpIndex = opcodes.indexOf(jumpLocationData);
            if (jumpIndex >= 0) {
                state.halted = true;
                const trueClone: any = state.clone();
                trueClone.pc = jumpIndex;
                trueClone.conditions.push(jumpCondition);
                const trueCloneTree = trueClone.parse();
                const falseClone = state.clone();
                falseClone.pc = state.pc + 1;
                const falseCloneTree: any = falseClone.parse();
                if (
                    trueCloneTree.length > 0 &&
                    trueCloneTree.length === falseCloneTree.length &&
                    trueCloneTree[0].name !== 'REVERT' &&
                    trueCloneTree[0].name !== 'INVALID' &&
                    trueCloneTree.map((item: any) => stringify(item)).join('') ===
                        falseCloneTree.map((item: any) => stringify(item)).join('')
                ) {
                    state.functions[''] = new TopLevelFunction(
                        trueCloneTree,
                        '',
                        trueCloneTree.gasUsed,
                        state.functionHashes
                    );
                } else if (
                    trueCloneTree.length > 0 &&
                    trueCloneTree[0].name !== 'REVERT' &&
                    trueCloneTree[0].name !== 'INVALID'
                ) {
                    state.instructions.push(
                        new JUMPI(jumpCondition, jumpLocation, trueCloneTree, falseCloneTree)
                    );
                }
            } else {
                state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
            }
        } else if (!(opcode.pc + ':' + Number(jumpLocation) in state.jumps)) {
            const jumpIndex = opcodes.indexOf(jumpLocationData);
            state.jumps[opcode.pc + ':' + Number(jumpLocation)] = true;
            if (jumpIndex >= 0) {
                state.halted = true;
                const trueClone: any = state.clone();
                trueClone.pc = jumpIndex;
                trueClone.conditions.push(jumpCondition);
                const trueCloneTree = trueClone.parse();
                const falseClone = state.clone();
                falseClone.pc = state.pc + 1;
                const falseCloneTree: any = falseClone.parse();
                if (
                    (falseCloneTree.length === 1 &&
                        'name' in falseCloneTree[0] &&
                        falseCloneTree[0].name === 'REVERT' &&
                        falseCloneTree[0].items &&
                        falseCloneTree[0].items.length === 0) ||
                    falseCloneTree[0].name === 'INVALID'
                ) {
                    if (
                        jumpCondition.name === 'CALL' &&
                        typeof jumpCondition.memoryLength === 'bigint' &&
                        jumpCondition.memoryLength === 0n &&
                        typeof jumpCondition.outputLength === 'bigint' &&
                        jumpCondition.outputLength === 0n &&
                        jumpCondition.gas.name === 'MUL' &&
                        jumpCondition.gas.left.name === 'ISZERO' &&
                        typeof jumpCondition.gas.right === 'bigint' &&
                        jumpCondition.gas.right === 2300n
                    ) {
                        jumpCondition.throwOnFail = true;
                        state.instructions.push(jumpCondition);
                        state.instructions.push(...trueCloneTree);
                    } else {
                        state.instructions.push(new REQUIRE(jumpCondition));
                        state.instructions.push(...trueCloneTree);
                    }
                } else {
                    state.instructions.push(
                        new JUMPI(jumpCondition, jumpLocation, trueCloneTree, falseCloneTree)
                    );
                }
            } else {
                state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
            }
        } else {
            state.instructions.push(new JUMPI(jumpCondition, jumpLocation, null, null, true));
        }
    }
};
