import { ControlFlowGraph, Jump, Jumpi } from '../cfg';
import { EVM } from '../evm';
import { Sig } from '../inst/logic';
import { TopLevelFunction } from '../inst/jumps';
import stringifyFunctions from './stringifyFunctions';
import { SLoad } from '../inst/storage';
import { stringifyVariable } from './stringifyVariables';
import { Variable } from '../contract';
import { Return } from '../inst/system';
import { isBigInt } from '../inst/utils';
import { Stmt } from '../state';

/**
 *
 * @param instructionTree
 * @param indentation
 * @returns
 */
export function stringifyInstructions(instructionTree: any, indentation = 0): string {
    let lines = '';
    instructionTree.forEach((instruction: any) => {
        if (instruction instanceof Jump) return;

        if (instruction.name === 'JUMPI' && instruction.false) {
            const condition = instruction.toString();
            const falseInstructions = instruction.false.filter((i: any) => i.debugLevel > 0);
            if (falseInstructions.length === 1 && falseInstructions[0].name === 'JUMPI') {
                lines += ' '.repeat(indentation) + 'if' + condition + ' {\n';
                lines += stringifyInstructions(instruction.true, indentation + 4);
                lines += ' '.repeat(indentation) + '} else ';
                const elseOrElseIf = stringifyInstructions(instruction.false, indentation);
                if (elseOrElseIf.trim().startsWith('if')) {
                    lines += elseOrElseIf.trim() + '\n';
                } else {
                    lines +=
                        '{\n' +
                        elseOrElseIf
                            .split('\n')
                            .filter(l => l)
                            .map(l => ' '.repeat(4) + l)
                            .join('\n');
                    lines += '\n' + ' '.repeat(indentation) + '}\n';
                }
            } else {
                lines += ' '.repeat(indentation) + 'if' + condition + ' {\n';
                lines += stringifyInstructions(instruction.true, indentation + 4);
                lines += ' '.repeat(indentation) + '} else {\n';
                lines += stringifyInstructions(instruction.false, indentation + 4);
                lines += ' '.repeat(indentation) + '}\n';
            }
        } else {
            lines += ' '.repeat(indentation) + instruction.toString() + '\n';
        }
    });
    return lines;
}

export function stringifyBlocks(
    { blocks, entry }: ControlFlowGraph,
    functionsHashes: EVM['functionHashes']
) {
    const pcs: { [key: string]: true } = {};
    let output = '';
    stringifyBlock(entry, 0);

    function stringifyBlock(key: string, indent: number) {
        if (key in pcs) {
            return;
        }

        pcs[key] = true;

        const block = blocks[key];
        if (!block) {
            console.log(key);
            return;
        }

        output += stringifyInstructions(block.stmts, indent);
        const last = block.stmts.at(-1);
        if (last instanceof Jumpi) {
            output += ' '.repeat(indent) + '{\n';
            stringifyBlock(last.destBranch!, indent + 4);
            output += ' '.repeat(indent) + '} else {\n';
            stringifyBlock(last.fallBranch!, indent + 4);
            output += ' '.repeat(indent) + '}\n';

            if (last.condition instanceof Sig) {
                const tlf = new TopLevelFunction(
                    blocks[last.destBranch!].stmts as any,
                    last.condition.hash,
                    {}
                );
                output += stringifyFunctions(last.condition.hash, tlf, functionsHashes);
                output += isVar(last.condition, functionsHashes, tlf.items);
            }
        } else if (last instanceof Jump) {
            output += ' '.repeat(indent) + '{\n';
            stringifyBlock(last.destBranch!, indent + 4);
            output += ' '.repeat(indent) + '}\n';
        }
    }

    return output;
}

export function isVar(jumpCondition: Sig, functionHashes: EVM['functionHashes'], stmts: Stmt[]) {
    if (
        jumpCondition.hash in functionHashes &&
        (items =>
            items.length === 1 &&
            items[0] instanceof Return &&
            items[0].args.length === 1 &&
            items[0].args[0] instanceof SLoad &&
            isBigInt(items[0].args[0].location))(stmts)
    ) {
        // const item = (tlf.items[0] as Return) .items[0] as SLOAD;
        const fullFunction = functionHashes[jumpCondition.hash];
        const variable = new Variable(fullFunction.split('(')[0], []);
        return stringifyVariable(variable, 0);
    }
    return '';
}
