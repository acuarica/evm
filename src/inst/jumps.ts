import { Require, wrap } from '../ast';
import { CallValue } from '../ast';
import { IsZero } from '../ast';

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
            return wrap(this.condition);
        } else if (this.valid) {
            return 'if' + wrap(this.condition) + ' goto(' + wrap(this.location) + ');';
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
// } else if (isVal(jumpCondition)) {
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
//                     isVal(items[0].items[0].location))(
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
//             isVal(jumpCondition.right) &&
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
//                     isVal(jumpCondition.memoryLength) &&
//                     jumpCondition.memoryLength === 0n &&
//                     isVal(jumpCondition.outputLength) &&
//                     jumpCondition.outputLength === 0n &&
//                     jumpCondition.gas.name === 'MUL' &&
//                     jumpCondition.gas.left.name === 'ISZERO' &&
//                     isVal(jumpCondition.gas.right) &&
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
