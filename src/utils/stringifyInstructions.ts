/**
 *
 * @param instructionTree
 * @param indentation
 * @returns
 */
export function stringifyInstructions(instructionTree: any, indentation = 0): string {
    let lines = '';
    instructionTree.forEach((instruction: any) => {
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
