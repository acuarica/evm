import { FNS } from './ast/special';
import { isInst, type Expr, type Inst, type Val, isExpr } from './ast/expr';
import type { IEvents } from './ast/log';
import type { IStore } from './ast/storage';
import { If, type Stmt } from './stmt';

/**
 *
 * @param strings
 * @param nodes
 * @returns
 */
export function sol(strings: TemplateStringsArray, ...nodes: unknown[]): string {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        const str = isExpr(node) ? solExpr(node) : isInst(node) ? solInst(node) : `${node}`;
        result.push(str, strings[i + 1]);
    });
    return result.join('');
}

const OPS = {
    Add: ['+', 11],
    Mul: ['*', 12],
    Sub: ['-', 11],
    Div: ['/', 12],
    Mod: ['%', 12],
    Exp: ['**', 14],
    Lt: ['<', 9],
    Gt: ['>', 9],
    Eq: ['==', 8],
    And: ['&', 4],
    Or: ['|', 3],
    Xor: ['^', 6],
} as const;

const prec = (expr: Expr): number => {
    const tag = expr.tag;
    if (tag in OPS) {
        return OPS[tag as keyof typeof OPS][1];
    } else {
        return 16;
    }
};

function paren(expr: Expr, exprc: Expr): string {
    return prec(expr) < prec(exprc) ? `(${expr})` : `${expr}`;
}

// prettier-ignore
function solExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val': return `${expr.isJumpDest() ? '[J]' : ''}0x${expr.val.toString(16)}`;
        case 'Add':
        case 'Mul':
        case 'Sub':
        case 'Div':
        case 'Mod':
        case 'Exp':
        case 'Lt':
        case 'Gt':
        case 'Eq':
        case 'And':
        case 'Or':
        case 'Xor': return `${paren(expr.left, expr)} ${OPS[expr.tag][0]} ${paren(expr.right, expr)}`;
        case 'IsZero': return '';
        case 'Not': return '';
        case 'Byte': return '';
        case 'Shl': return '';
        case 'Shr': return '';
        case 'Sar': return '';
        case 'Sig': return '';
        case 'CallValue': return '';
        case 'CallDataLoad': return '';
        case 'Prop': return expr.value;
        case 'Fn': return FNS[expr.mnemonic][0](solExpr(expr.value));
        case "DataCopy": return '';
        case "MLoad": return '';
        case 'Sha3': return expr.memoryStart && expr.memoryLength
            ? `keccak256(memory[${expr.memoryStart}:(${expr.memoryStart}+${expr.memoryLength})])`
            : `keccak256(${expr.args.join(', ')})`;
        case 'Create': return '';
        case 'Call': return '';
        case 'ReturnData': return '';
        case 'CallCode': return '';
        case 'Create2': return '';
        case 'StaticCall': return '';
        case 'DelegateCall': return '';
        case 'SLoad': return '';
        case 'MappingLoad': return '';
    }
}

function solInst(inst: Inst): string {
    switch (inst.name) {
        case 'MStore':
            return `memory[${inst.location}] = ${inst.data};`;
        case 'Stop':
            return 'return;';
        case 'Return':
            return inst.offset && inst.size
                ? `return memory[${inst.offset}:(${inst.offset}+${inst.size})];`
                : inst.args.length === 0
                ? 'return;'
                : isStringReturn(inst.args) && inst.args[0].val === 32n
                ? `return '${hex2a(inst.args[2].val.toString(16))}';`
                : inst.args.length === 1
                ? `return ${inst.args[0]};`
                : `return (${inst.args.join(', ')});`;
        case 'Revert':
            return inst.offset && inst.size
                ? `revert(memory[${inst.offset}:(${inst.offset}+${inst.size})]);`
                : `revert(${inst.args.join(', ')});`;
        case 'SelfDestruct':
            return `selfdestruct(${inst.address});`;
        case 'Invalid':
            return `revert('Invalid instruction (0x${inst.opcode.toString(16)})');`;
        case 'Log':
            return inst.eventName
                ? `emit ${inst.eventName}(${[...inst.topics.slice(1), ...(inst.args ?? [])].join(
                      ', '
                  )});`
                : 'log(' +
                      (inst.args === undefined
                          ? [...inst.topics, `memory[${inst.mem.offset}:${inst.mem.size} ]`].join(
                                ', '
                            ) + 'ii'
                          : [...inst.topics, ...inst.args].join(', ')) +
                      ');';
        case 'Jump':
            return `goto :${inst.offset} branch:${inst.destBranch.key}`;
        case 'Jumpi':
            return `when ${inst.cond} goto ${inst.destBranch.key} or fall ${inst.fallBranch.key}`;
        case 'JumpDest':
            return `fall: ${inst.fallBranch.key}:`;
        case 'SigCase':
            return `case when ${inst.condition} goto ${inst.offset} or fall ${inst.fallBranch.key}`;
        case 'SStore': {
            let variableName = 'storage[' + inst.location.str() + ']';
            if (inst.location.isVal() && inst.location.val.toString() in inst.variables) {
                const loc = inst.location.val.toString();
                const label = inst.variables[loc].label;
                if (label) {
                    variableName = label;
                } else {
                    variableName = `var${Object.keys(inst.variables).indexOf(loc) + 1}`;
                }
            }
            if (
                inst.data.tag === 'Add' &&
                inst.data.left.tag === 'SLoad' &&
                inst.data.left.location.str() === inst.location.str()
            ) {
                return variableName + ' += ' + inst.data.right.str() + ';';
            } else if (
                inst.data.tag === 'Sub' &&
                inst.data.left.tag === 'SLoad' &&
                inst.data.left.location.str() === inst.location.str()
            ) {
                return variableName + ' -= ' + inst.data.right.str() + ';';
            } else {
                return variableName + ' = ' + inst.data.str() + ';';
            }
        }
        case 'MappingStore': {
            let mappingName = `mapping${inst.location + 1}`;
            if (inst.location in inst.mappings && inst.mappings[inst.location].name) {
                mappingName = inst.mappings[inst.location].name!;
            }

            if (
                inst.data.tag === 'Add' &&
                inst.data.right.tag === 'MappingLoad' &&
                inst.data.right.location === inst.location
            ) {
                return (
                    mappingName +
                    inst.items.map(item => '[' + item.str() + ']').join('') +
                    ' += ' +
                    inst.data.left.str() +
                    ';'
                );
            } else if (
                inst.data.tag === 'Add' &&
                inst.data.left.tag === 'MappingLoad' &&
                inst.data.left.location === inst.location
            ) {
                return (
                    mappingName +
                    inst.items.map(item => '[' + item.str() + ']').join('') +
                    ' += ' +
                    inst.data.right.str() +
                    ';'
                );
            } else if (
                inst.data.tag === 'Sub' &&
                inst.data.left.tag === 'MappingLoad' &&
                inst.data.left.location === inst.location
            ) {
                return (
                    mappingName +
                    inst.items.map(item => '[' + item.str() + ']').join('') +
                    ' -= ' +
                    inst.data.right.str() +
                    ';'
                );
            } else {
                return (
                    mappingName +
                    inst.items.map(item => `[${item.str()}]`).join('') +
                    ' = ' +
                    inst.data.str() +
                    ';'
                );
            }
        }

        case 'Throw':
            return `throw('${inst.reason}');`;
    }
}

function isStringReturn(args: Expr[]): args is [Val, Val, Val] {
    return args.length === 3 && args.every(arg => arg.isVal());
}

function hex2a(hexstr: string) {
    let str = '';
    for (let i = 0; i < hexstr.length && hexstr.slice(i, i + 2) !== '00'; i += 2) {
        str += String.fromCharCode(parseInt(hexstr.substring(i, i + 2), 16));
    }
    return str;
}

function solStmt(stmt: Stmt): string {
    switch (stmt.name) {
        case 'If':
            return `(${stmt.condition})`;
        case 'CallSite':
            return `$${stmt.selector}();`;
        case 'Require':
            return `require(${[stmt.condition, ...stmt.args].join(', ')});`;
        default:
            return solInst(stmt);
    }
}

/**
 *
 * @param stmts
 * @param indentation
 * @returns
 */
export function solStmts(stmts: Stmt[], indentation = 0): string {
    let text = '';
    for (const stmt of stmts) {
        if (stmt instanceof If) {
            const condition = solStmt(stmt);
            text += ' '.repeat(indentation) + 'if ' + condition + ' {\n';
            text += solStmts(stmt.trueBlock!, indentation + 4);
            if (stmt.falseBlock) {
                text += ' '.repeat(indentation) + '} else {\n';
                text += solStmts(stmt.falseBlock, indentation + 4);
            }
            text += ' '.repeat(indentation) + '}\n';
        } else {
            text += ' '.repeat(indentation) + solStmt(stmt) + '\n';
        }
    }

    return text;
}

/**
 *
 * @param events
 * @returns
 */
export function solEvents(events: IEvents) {
    let text = '';

    for (const [topic, event] of Object.entries(events)) {
        text += 'event ';
        if (event.sig === undefined) {
            text += topic;
        } else {
            const eventName = event.sig.split('(')[0];
            const params = event.sig.replace(eventName, '').substring(1).slice(0, -1);
            if (params) {
                text += eventName + '(';
                text += params
                    .split(',')
                    .map((param, i) =>
                        i < event.indexedCount ? `${param} indexed _arg${i}` : `${param} _arg${i}`
                    )
                    .join(', ');
                text += ')';
            } else {
                text += event.sig;
            }
        }
        text += ';\n';
    }

    return text;
}

/**
 *
 * @param variables
 * @returns
 */
export function solVars(variables: IStore['variables']) {
    let output = '';
    Object.entries(variables).forEach(([hash, variable], index) => {
        const types: string[] = variable.types
            .map(expr => expr.eval())
            .map(expr => (expr.isVal() ? 'bigint' : expr.type ?? ''))
            .filter(t => t.trim() !== '');
        if (types.length === 0) {
            types.push('unknown');
        }
        const name = variable.label ? ` public ${variable.label}` : ` var${index + 1}`;
        output += [...new Set(types)].join('|') + name + '; // Slot #' + hash;
        output += '\n';
    });

    if (Object.keys(variables).length > 0) {
        output += '\n';
    }

    return output;
}

/**
 *
 * @param mappings
 * @returns
 */
export function solStructs(mappings: IStore['mappings']) {
    let text = '';

    Object.keys(mappings)
        .filter(key => mappings[key].structs.length > 0)
        .forEach(key => {
            const mapping = mappings[key];
            text += `struct ${mapping.name}Struct {\n`;
            mapping.structs.forEach(struct => {
                text += `    ${struct.toString()};\n`;
            });
            text += '}\n\n';
        });

    return text;
}

/**
 *
 * @param mappings
 * @returns
 */
export function solMappings(mappings: IStore['mappings']) {
    let output = '';

    Object.keys(mappings).forEach((key: string, index: number) => {
        const mapping = mappings[key];
        if (mapping.name) {
            output += solMapping(mapping) + ' public ' + mapping.name + ';';
        } else {
            output += solMapping(mapping) + ` mapping${index + 1};`;
        }
        output += '\n';
    });

    if (Object.keys(mappings).length > 0) {
        output += '\n';
    }

    return output;

    function solMapping(mapping: IStore['mappings'][keyof IStore['mappings']]) {
        const mappingKey: string[] = [];
        const mappingValue: string[] = [];
        let deepMapping = false;
        mapping.keys
            .filter(mappingChild => mappingChild.length > 0)
            .forEach(mappingChild => {
                const mappingChild0 = mappingChild[0];
                if (
                    mappingChild.length > 0 &&
                    mappingChild0.type &&
                    !mappingKey.includes(mappingChild0.type)
                ) {
                    mappingKey.push(mappingChild0.type);
                }
                if (mappingChild.length > 1 && !deepMapping) {
                    deepMapping = true;
                    mappingValue.push(
                        solMapping({
                            name: mapping.name,
                            structs: mapping.structs,
                            keys: mapping.keys.map(items => {
                                items.shift();
                                return items;
                            }),
                            values: mapping.values,
                        })
                    );
                } else if (mappingChild.length === 1 && !deepMapping) {
                    mapping.values.forEach(mappingChild2 => {
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
            mappingValue.push(`${mapping.name}Struct`);
        } else if (mappingValue.length === 0) {
            mappingValue.push('unknown');
        }
        return 'mapping (' + mappingKey.join('|') + ' => ' + mappingValue.join('|') + ')';
    }
}
