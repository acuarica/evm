/* eslint-disable @typescript-eslint/no-unused-vars */
import stringify from '../utils/stringify';
import { CallValue } from './info';
import { IsZero } from './logic';
import { Instruction, Operand } from '../state';

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
    readonly label: string;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: any;

    constructor(
        readonly items: Instruction[],
        readonly hash: string,
        // readonly gasUsed: number,
        functionHashes: { [s: string]: string }
    ) {
        this.payable = true;
        this.visibility = 'public';
        this.constant = true;
        this.returns = [];
        if (this.hash in functionHashes) {
            this.label = functionHashes[this.hash];
        } else {
            this.label = this.hash + '()';
        }
        if (
            this.items.length > 0 &&
            this.items[0] instanceof Require &&
            this.items[0].condition instanceof IsZero &&
            this.items[0].condition.value instanceof CallValue
        ) {
            this.payable = false;
            this.items.shift();
        }
        if (this.items.length === 1 && this.items[0].name === 'RETURN') {
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
                this.items.forEach(item => updateCallDataLoad(item, argumentTypes));
            }
        }
        const returns: any = [];
        this.items.forEach(item => {
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
    constructor(public label: string | undefined, readonly types: any[]) {}
}

export class Require {
    readonly name = 'REQUIRE';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly condition: Operand) {}

    toString() {
        return 'require(' + stringify(this.condition) + ');';
    }
}

export class JUMPI {
    readonly name = 'JUMPI';
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
                this.true[0] instanceof Require &&
                this.true[0].condition instanceof IsZero &&
                this.true[0].condition.value instanceof CallValue
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

// export default (opcode: Opcode, state: EVM & State): void => {
// const jumpLocation = state.stack.pop();
// const jumpCondition = state.stack.pop();

// state.halted = true;
// state

// if (typeof jumpLocation !== 'bigint') {
// state.halted = true;
// state.stmts.push(new JUMPI(jumpCondition, jumpLocation));
// } else {
// const opcodes = state.getOpcodes();
// const jumpLocationData = opcodes.find(o => o.pc === Number(jumpLocation));
// if (!jumpLocationData || jumpLocationData.opcode !== OPCODES.JUMPDEST) {
// state.halted = true;
//state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
// state.stmts.push(new Require(jumpCondition));
// } else if (typeof jumpCondition === 'bigint') {
// const jumpIndex = opcodes.indexOf(jumpLocationData);
//         if (
//             jumpIndex >= 0 &&
//             jumpCondition !== 0n &&
//             !(opcode.pc + ':' + Number(jumpLocation) in state.jumps)
//         ) {
//             state.jumps[opcode.pc + ':' + Number(jumpLocation)] = [...state.instructions];
//             state.pc = jumpIndex;
//         }
//     } else if (
//         !(opcode.pc + ':' + Number(jumpLocation) in state.jumps) &&
//         jumpCondition.name === 'SIG'
//     ) {
//         const jumpIndex = opcodes.indexOf(jumpLocationData);

//         state.jumps[opcode.pc + ':' + Number(jumpLocation)] = [...state.instructions];

//         if (jumpIndex >= 0) {
//             const functionClone = state.clone();
//             functionClone.pc = jumpIndex;
//             const functionCloneTree = functionClone.parse();
//             // state.jumps.
//             state.functions[jumpCondition.hash] = new TopLevelFunction(
//                 functionCloneTree,
//                 jumpCondition.hash,
//                 // functionClone.gasUsed,
//                 state.functionHashes
//             );
//             if (
//                 jumpCondition.hash in state.functionHashes &&
//                 functionCloneTree.length === 1 &&
//                 functionCloneTree[0].name === 'RETURN' &&
//                 functionCloneTree[0].items.every(item => item instanceof MappingLoad)
//             ) {
//                 (functionCloneTree[0].items as MappingLoad[]).forEach(item => {
//                     const fullFunction = state.functionHashes[jumpCondition.hash];
//                     state.mappings[item.location].name = fullFunction.split('(')[0];
//                     if (
//                         item.structlocation &&
//                         !state.mappings[item.location].structs.includes(item.structlocation)
//                     ) {
//                         state.mappings[item.location].structs.push(item.structlocation);
//                     }
//                 });
//                 delete state.functions[jumpCondition.hash];
//             } else if (
//                 jumpCondition.hash in state.functionHashes &&
//                 (items =>
//                     items.length === 1 &&
//                     items[0].name === 'RETURN' &&
//                     items[0].items.length === 1 &&
//                     items[0].items[0] instanceof SLOAD &&
//                     typeof items[0].items[0].location === 'bigint')(
//                     state.functions[jumpCondition.hash].items
//                 )
//             ) {
//                 const item = (state.functions[jumpCondition.hash].items[0] as Return)
//                     .items[0] as SLOAD;
//                 if (!(item.location in state.variables)) {
//                     const fullFunction = state.functionHashes[jumpCondition.hash];
//                     state.variables[item.location] = new Variable(
//                         fullFunction.split('(')[0],
//                         []
//                     );
//                     delete state.functions[jumpCondition.hash];
//                 } else {
//                     const fullFunction = state.functionHashes[jumpCondition.hash];
//                     state.variables[item.location].label = fullFunction.split('(')[0];
//                     delete state.functions[jumpCondition.hash];
//                 }
//             }
//         }
//     } else if (
//         !(opcode.pc + ':' + Number(jumpLocation) in state.jumps) &&
//         ((jumpCondition.name === 'LT' &&
//             jumpCondition.left.name === 'CALLDATASIZE' &&
//             typeof jumpCondition.right === 'bigint' &&
//             jumpCondition.right === 4n) ||
//             (jumpCondition.name === 'ISZERO' && jumpCondition.value instanceof CALLDATASIZE))
//     ) {
//         const jumpIndex = opcodes.indexOf(jumpLocationData);

//         state.jumps[opcode.pc + ':' + Number(jumpLocation)] = [...state.instructions];

//         if (jumpIndex >= 0) {
//             // state.halted = true;
//             const trueClone = state.clone();
//             trueClone.pc = jumpIndex;
//             // trueClone.conditions.push(jumpCondition);
//             const trueCloneTree = trueClone.parse();
//             const falseClone = state.clone();
//             falseClone.pc = state.pc + 1;
//             const falseCloneTree = falseClone.parse();
//             if (
//                 trueCloneTree.length > 0 &&
//                 trueCloneTree.length === falseCloneTree.length &&
//                 trueCloneTree[0].name !== 'REVERT' &&
//                 trueCloneTree[0].name !== 'INVALID' &&
//                 trueCloneTree.map(item => stringify(item)).join('') ===
//                     falseCloneTree.map(item => stringify(item)).join('')
//             ) {
//                 state.functions[''] = new TopLevelFunction(
//                     trueCloneTree,
//                     '',
//                     // trueClone.gasUsed,
//                     state.functionHashes
//                 );
//             } else if (
//                 trueCloneTree.length > 0 &&
//                 trueCloneTree[0].name !== 'REVERT' &&
//                 trueCloneTree[0].name !== 'INVALID'
//             ) {
//                 state.instructions.push(
//                     new JUMPI(jumpCondition, jumpLocation, trueCloneTree, falseCloneTree)
//                 );
//             }
//         } else {
//             state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
//         }

// } else if (!(opcode.pc + ':' + Number(jumpLocation) in state.jumps)) {
//     const jumpIndex = opcodes.indexOf(jumpLocationData);
//     state.jumps[opcode.pc + ':' + Number(jumpLocation)] = [...state.instructions];
//     if (jumpIndex >= 0) {
//         // state.halted = true;
//         const trueClone = state.clone();
//         trueClone.pc = jumpIndex;
//         // trueClone.conditions.push(jumpCondition);
//         const trueCloneTree = trueClone.parse();
//         const falseClone = state.clone();
//         falseClone.pc = state.pc + 1;
//         const falseCloneTree = falseClone.parse();
//         // state.jumps = { ...state.jumps, ...trueClone.jumps, ...falseClone.jumps };
//         if (isRevertBlock(falseCloneTree)) {

//                 if (
//                     jumpCondition.name === 'CALL' &&
//                     typeof jumpCondition.memoryLength === 'bigint' &&
//                     jumpCondition.memoryLength === 0n &&
//                     typeof jumpCondition.outputLength === 'bigint' &&
//                     jumpCondition.outputLength === 0n &&
//                     jumpCondition.gas.name === 'MUL' &&
//                     jumpCondition.gas.left.name === 'ISZERO' &&
//                     typeof jumpCondition.gas.right === 'bigint' &&
//                     jumpCondition.gas.right === 2300n
//                 ) {
//                     jumpCondition.throwOnFail = true;
//                     state.instructions.push(jumpCondition);
//                     state.instructions.push(...trueCloneTree);
//                 } else {

// console.log('revert false');
// state.instructions.push(new Require(jumpCondition));
// state.instructions.push(...trueCloneTree);
// }

// } else if (isRevertBlock(trueCloneTree)) {
//         console.log('revert true');

//         state.instructions.push(new Require(new Neg( jumpCondition)));
//         state.instructions.push(...falseCloneTree);
// } else {
// state.instructions.push(
// new JUMPI(jumpCondition, jumpLocation, trueCloneTree, falseCloneTree)
// );
// }
// } else {
// state.instructions.push(new JUMPI(jumpCondition, jumpLocation));
// }
//     } else {
//         // state.instructions.push(new JUMPI(jumpCondition, jumpLocation, null, null, true));
//         state.instructions.push(...state.jumps[opcode.pc + ':' + Number(jumpLocation)]);
// }
// }
// };

export function isRevertBlock(falseCloneTree: Instruction[]): boolean {
    return (
        falseCloneTree.length === 1 &&
        'name' in falseCloneTree[0] &&
        falseCloneTree[0].name === 'REVERT' &&
        falseCloneTree[0].items !== undefined &&
        falseCloneTree[0].items.length === 0
        // || falseCloneTree[0].name === 'INVALID'
    );
}
