import { evalExpr, If, isBigInt, Jump, Stmt } from './ast';
import { Contract, TopLevelFunction } from './contract';

/**
 *
 * @param contract
 * @param eventDecls
 * @returns
 */
export function stringify(contract: Contract, eventDecls: string[]) {
    const events = stringifyEvents(contract.events, eventDecls);
    const structs = stringifyStructs(contract.mappings);
    const mappings = stringifyMappings(contract.mappings);
    const variables = stringifyVariables(contract.variables);
    const functions = Object.keys(contract.functions)
        .map(functionName =>
            stringifyFunction(
                functionName,
                contract.functions[functionName],
                contract.functionHashes
            )
        )
        .join('');
    const main = stringifyInstructions(contract.main.stmts);
    return events + structs + mappings + variables + functions + main;
}

/**
 *
 * @param stateEvents
 * @param events
 * @returns
 */
function stringifyEvents(stateEvents: Contract['events'], events: string[]) {
    const stateEventValues = Object.keys(stateEvents).map(key => stateEvents[key]);
    let output = '';

    events.forEach(event => {
        const eventName = event.split('(')[0];
        const eventArguments = event.replace(eventName, '').substring(1).slice(0, -1);
        output += 'event ';
        if (eventArguments) {
            output += eventName + '(';
            output += eventArguments
                .split(',')
                .map((a, i) => {
                    const stateEvent = stateEventValues.find(e => e.label === event);
                    if (stateEvent && i < stateEvent.indexedCount) {
                        return a + ' indexed _arg' + i;
                    } else {
                        return a + ' _arg' + i;
                    }
                })
                .join(', ');
            output += ');';
        } else {
            output += event;
        }
        output += '\n';
    });

    if (events.length > 0) {
        output += '\n';
    }

    return output;
}

/**
 *
 * @param mappings
 * @returns
 */
function stringifyStructs(mappings: any) {
    let output = '';

    Object.keys(mappings)
        .filter((key: any) => mappings[key].structs.length > 0)
        .forEach((key: string, _index: number) => {
            const mapping = mappings[key];
            output += 'struct ' + mapping.name + 'Struct {\n';
            mapping.structs.forEach((struct: any) => {
                output += '    ' + struct.toString() + ';\n';
            });
            output += '}\n\n';
        });

    return output;
}

/**
 *
 * @param mappings
 * @returns
 */
function stringifyMappings(mappings: any) {
    let output = '';

    Object.keys(mappings).forEach((key: string, index: number) => {
        const mapping = mappings[key];
        if (mapping.name) {
            output += stringifyMapping(mapping) + ' public ' + mapping.name + ';';
        } else {
            output += stringifyMapping(mapping) + ' mapping' + (index + 1) + ';';
        }
        output += '\n';
    });

    if (Object.keys(mappings).length > 0) {
        output += '\n';
    }

    return output;

    /**
     *
     * @param mapping
     * @returns
     */
    function stringifyMapping(mapping: any) {
        const mappingKey: string[] = [];
        const mappingValue: string[] = [];
        let deepMapping = false;
        mapping.keys
            .filter((mappingChild: any) => mappingChild.length > 0)
            .forEach((mappingChild: any) => {
                if (
                    mappingChild.length > 0 &&
                    mappingChild[0].type &&
                    !mappingKey.includes(mappingChild[0].type)
                ) {
                    mappingKey.push(mappingChild[0].type);
                }
                if (mappingChild.length > 1 && !deepMapping) {
                    deepMapping = true;
                    mappingValue.push(
                        stringifyMapping({
                            name: mapping.name,
                            structs: mapping.structs,
                            keys: mapping.keys.map((items: any) => {
                                items.shift();
                                return items;
                            }),
                            values: mapping.values,
                        })
                    );
                } else if (mappingChild.length === 1 && !deepMapping) {
                    mapping.values.forEach((mappingChild2: any) => {
                        if (mappingChild2.type && !mappingValue.includes(mappingChild2.type)) {
                            mappingValue.push(mappingChild2.type);
                        }
                    });
                }
            });
        if (mappingKey.length === 0) {
            mappingKey.push('unknown');
        }
        if (mapping.structs.length > 0 && mappingValue.length === 0) {
            mappingValue.push(mapping.name + 'Struct');
        } else if (mappingValue.length === 0) {
            mappingValue.push('unknown');
        }
        return 'mapping (' + mappingKey.join('|') + ' => ' + mappingValue.join('|') + ')';
    }
}

/**
 *
 * @param variables
 * @returns
 */
function stringifyVariables(variables: Contract['variables']) {
    let output = '';
    Object.entries(variables).forEach(([hash, variable], index) => {
        const types = variable.types
            .map(expr => evalExpr(expr))
            .map(expr => (!isBigInt(expr) ? expr.type ?? '' : 'bigint'))
            .filter(t => t.trim() !== '');
        if (types.length === 0) {
            types.push('unknown');
        }
        const name = variable.label ? ` public ${variable.label}` : ` var${index + 1}`;
        output += [...new Set(types)].join('|') + name + '; // #' + hash;
        output += '\n';
    });

    if (Object.keys(variables).length > 0) {
        output += '\n';
    }

    return output;
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

/**
 *
 * @param stmts
 * @param indentation
 * @returns
 */
function stringifyInstructions(stmts: Stmt[], indentation = 0): string {
    let output = '';
    for (const instruction of stmts) {
        if (instruction instanceof Jump) break;

        if (instruction instanceof If) {
            const condition = instruction.toString();
            // const falseInstructions = instruction.false.filter((i: any) => i.debugLevel > 0);
            // if (falseInstructions.length === 1 && falseInstructions[0].name === 'JUMPI') {
            //     output += ' '.repeat(indentation) + 'if' + condition + ' {\n';
            //     output += stringifyInstructions(instruction.true, indentation + 4);
            //     output += ' '.repeat(indentation) + '} else ';
            //     const elseOrElseIf = stringifyInstructions(instruction.false, indentation);
            //     if (elseOrElseIf.trim().startsWith('if')) {
            //         output += elseOrElseIf.trim() + '\n';
            //     } else {
            //         output +=
            //             '{\n' +
            //             elseOrElseIf
            //                 .split('\n')
            //                 .filter(l => l)
            //                 .map(l => ' '.repeat(4) + l)
            //                 .join('\n');
            //         output += '\n' + ' '.repeat(indentation) + '}\n';
            //     }
            // } else {
            output += ' '.repeat(indentation) + 'if ' + condition + ' {\n';
            output += stringifyInstructions(instruction.trueBlock!, indentation + 4);
            if (instruction.falseBlock) {
                output += ' '.repeat(indentation) + '} else {\n';
                output += stringifyInstructions(instruction.falseBlock, indentation + 4);
            }
            output += ' '.repeat(indentation) + '}\n';
            // }
        } else {
            output += ' '.repeat(indentation) + instruction.toString() + '\n';
        }
    }

    return output;
}
