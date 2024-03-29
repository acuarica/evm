import { Contract, type PublicFunction } from '.';
import { fnsig, parseSig } from './abi';
import { If, Revert, Tag, Val, evalE, isExpr, isInst, type Expr, type IReverts, type Inst, type Stmt } from './ast';
import type { IEvents } from './ast/log';
import { FNS } from './ast/special';
import type { IStore } from './ast/storage';

/**
 *
 * @param strings
 * @param nodes
 * @returns
 */
export function sol(strings: TemplateStringsArray, ...nodes: unknown[]): string {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const str = isExpr(node) ? solExpr(node) : isInst(node) ? solStmt(node) : `${node}`;
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
    Not: ['not', 14],
    Byte: ['byte', 10],
    Shl: ['<<', 10],
    Shr: ['>>>', 10],
    Sar: ['>>', 10],
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
    return prec(expr) < prec(exprc) ? sol`(${expr})` : sol`${expr}`;
}

function solExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val':
            return `${expr.isJumpDest() ? '[J]' : ''}0x${expr.val.toString(16)}`;
        case 'Local':
            return expr.nrefs > 0
                ? `local${expr.index}`
                : expr.count >= 1000
                    ? `/*expression too big to decompile: ${expr.count} AST nodes*/local${expr.index}`
                    : sol`${expr.value}`;
        case 'Add':
        case 'Mul':
        case 'Sub':
        case 'Div':
        case 'Mod':
        case 'Exp':
        case 'Eq':
        case 'And':
        case 'Or':
        case 'Xor':
            return `${paren(expr.left, expr)} ${OPS[expr.tag][0]} ${paren(expr.right, expr)}`;
        case 'Lt':
        case 'Gt':
            return `${paren(expr.left, expr)} ${OPS[expr.tag][0]}${expr.equal ? '=' : ''} ${paren(
                expr.right,
                expr
            )}`;
        case 'IsZero':
            return expr.value.tag === 'Eq'
                ? paren(expr.value.left, expr) + ' != ' + paren(expr.value.right, expr)
                : paren(expr.value, expr) + ' == 0';
        case 'Not':
            return `~${paren(expr.value, expr)}`;
        case 'Byte':
            return `(${paren(expr.data, expr)} >> ${paren(expr.pos, expr)}) & 1`;
        case 'Shl':
        case 'Shr':
        case 'Sar':
            return `${paren(expr.value, expr)} ${OPS[expr.tag][0]} ${paren(expr.shift, expr)}`;
        case 'Sig':
            return `msg.sig == ${expr.selector}`;
        case 'CallValue':
            return 'msg.value';
        case 'CallDataLoad': {
            const location = expr.location;
            return location.isVal() && location.val === 0n
                ? 'msg.data'
                : location.isVal() && (location.val - 4n) % 32n === 0n
                    ? `_arg${(location.val - 4n) / 32n}`
                    : sol`msg.data[${location}]`;
        }
        case 'Prop':
            return expr.symbol;
        case 'Fn':
            return FNS[expr.mnemonic][0](solExpr(expr.value));
        case 'DataCopy':
            switch (expr.kind) {
                case 'calldatacopy':
                    return sol`msg.data[${expr.offset}:(${expr.offset}+${expr.size})]`;
                case 'codecopy':
                    return sol`this.code[${expr.offset}:(${expr.offset}+${expr.size})]`;
                case 'extcodecopy':
                    return sol`address(${expr.address}).code[${expr.offset}:(${expr.offset}+${expr.size})]`;
                case 'returndatacopy':
                    return sol`output[${expr.offset}:(${expr.offset}+${expr.size})]`;
            }
        case 'MLoad':
            return sol`memory[${expr.location}]`;
        case 'Sha3':
            return expr.args === undefined
                ? sol`keccak256(memory[${expr.offset}:(${expr.offset}+${expr.size})])`
                : `keccak256(${expr.args.map(solExpr).join(', ')})`;
        case 'Create':
            return sol`new Contract(memory[${expr.offset}..${expr.offset}+${expr.size}]).value(${expr.value}).address`;
        case 'Call':
            return expr.argsLen.isZero() && expr.retLen.isZero()
                ? expr.gas.tag === 'Mul' &&
                    expr.gas.left.isZero() &&
                    expr.gas.right.isVal() &&
                    expr.gas.right.val === 2300n
                    ? expr.throwOnFail
                        ? sol`address(${expr.address}).transfer(${expr.value})`
                        : sol`address(${expr.address}).send(${expr.value})`
                    : sol`address(${expr.address}).call.gas(${expr.gas}).value(${expr.value})`
                : sol`call(${expr.gas},${expr.address},${expr.value},${expr.argsStart},${expr.argsLen},${expr.retStart},${expr.retLen})`;
        case 'ReturnData':
            return sol`output:ReturnData:${expr.retOffset}:${expr.retSize}`;
        case 'CallCode':
            return sol`callcode(${expr.gas},${expr.address},${expr.value},${expr.memoryStart},${expr.memoryLength},${expr.outputStart},${expr.outputLength})`;
        case 'Create2':
            return sol`new Contract(memory[${expr.offset}:(${expr.offset}+${expr.size})]).value(${expr.value}).address`;
        case 'StaticCall':
            return sol`staticcall(${expr.gas},${expr.address},${expr.memoryStart},${expr.memoryLength},${expr.outputStart},${expr.outputLength})`;
        case 'DelegateCall':
            return sol`delegatecall(${expr.gas},${expr.address},${expr.memoryStart},${expr.memoryLength},${expr.outputStart},${expr.outputLength})`;
        case 'SLoad': {
            // const slot = expr.slot.eval();
            // if (slot.isVal() && expr.variable !== undefined) {
            if (expr.variable !== undefined) {
                // const loc = slot.val;
                const label = expr.variable.label;
                if (label) {
                    return label;
                } else {
                    // return `var${Object.keys(expr.variables).indexOf(loc) + 1}`;
                    return `var_${expr.variable.index}`;
                }
            } else {
                return sol`storage[${expr.slot}]`;
            }
        }
        case 'MappingLoad': {
            let mappingName = `mapping${expr.location + 1}`;
            const maybeName = expr.mappings[expr.location].name;
            if (expr.location in expr.mappings && maybeName) {
                mappingName = maybeName;
            }
            if (expr.structlocation) {
                return (
                    mappingName +
                    expr.items.map(item => sol`[${item}]`).join('') +
                    '[' +
                    expr.structlocation.toString() +
                    ']'
                );
            } else {
                return mappingName + expr.items.map(item => '[' + solExpr(item) + ']').join('');
            }
        }
    }
}

function sigName(sig: string | undefined): string | undefined {
    if (sig === undefined) return undefined;
    try {
        return parseSig(sig).name;
    } catch {
        return sig;
    }
}

function solInst(inst: Inst): string {
    switch (inst.name) {
        case 'Local':
            return sol`${inst.local.value.type} local${inst.local.index} = ${inst.local.value}; // #refs ${inst.local.nrefs}`;
        case 'MStore':
            return sol`memory[${inst.location}] = ${inst.data};`;
        case 'Stop':
            return 'return;';
        case 'Return':
            return inst.args === undefined
                ? sol`return memory[${inst.offset}:(${inst.offset}+${inst.size})];`
                : inst.args.length === 0
                    ? 'return;'
                    : isStringReturn(inst.args) && inst.args[0].val === 32n
                        ? `return '${hex2a(inst.args[2].val.toString(16))}';`
                        : inst.args.length === 1
                            ? sol`return ${inst.args[0]};`
                            : `return (${inst.args.map(solExpr).join(', ')});`;
        case 'Revert': {
            const revertMsg = inst.selector !== undefined ? getRevertMsg(inst, inst.selector) : undefined;
            return revertMsg !== undefined
                ? `revert(${revertMsg});`
                : inst.args === undefined
                    ? sol`revert(memory[${inst.offset}:(${inst.offset}+${inst.size})]);`
                    : inst.selector !== undefined
                        ? `revert ${sigName(inst.sig?.sig) ?? inst.selector}(${inst.args.map(solExpr).join(', ')});`
                        : `revert(${inst.args.map(solExpr).join(', ')});`;
        }
        case 'SelfDestruct':
            return sol`selfdestruct(${inst.address});`;
        case 'Invalid':
            return `revert('Invalid instruction (0x${inst.opcode.toString(16)})');`;
        case 'Log':
            return inst.eventName
                ? `emit ${inst.eventName}(${[...inst.topics.slice(1), ...(inst.args ?? [])]
                    .map(solExpr)
                    .join(', ')});`
                : 'log(' +
                (inst.args === undefined
                    ? [...inst.topics, sol`memory[${inst.offset}:${inst.size} ]`].join(', ') +
                    'ii'
                    : [...inst.topics, ...inst.args].map(solExpr).join(', ')) +
                ');';
        case 'Jump':
            return sol`goto :${inst.offset} branch:${inst.destBranch.pc}`;
        case 'Jumpi':
            return sol`when ${inst.cond} goto ${inst.destBranch.pc} or fall ${inst.fallBranch.pc}`;
        case 'JumpDest':
            return `fall: ${inst.fallBranch.pc}:`;
        case 'SigCase':
            return sol`case when ${inst.condition} goto ${inst.offset} or fall ${inst.fallBranch.pc}`;
        case 'SStore': {
            const slot = inst.slot.eval();

            const isLoad = (value: Expr) =>
                value.tag === 'SLoad' && solExpr(value.slot.eval()) === solExpr(slot);

            let varName = sol`storage[${slot}]`;
            if (slot.isVal() && inst.variable !== undefined) {
                const label = inst.variable.label;
                if (label) {
                    varName = label;
                } else {
                    // varName = `var${[...inst.variables.keys()].indexOf(loc) + 1}__${inst.variables.get(loc)!.index}`;
                    varName = `var_${inst.variable.index}`;
                }
            }

            const data = inst.data.eval();
            if (data.tag === 'Add' && isLoad(data.left)) {
                return sol`${varName} += ${data.right};`;
            } else if (data.tag === 'Add' && isLoad(data.right)) {
                return sol`${varName} += ${data.left};`;
            } else if (data.tag === 'Sub' && isLoad(data.left)) {
                return sol`${varName} -= ${data.right};`;
            } else {
                return sol`${varName} = ${inst.data};`;
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
                    inst.items.map(item => '[' + solExpr(item) + ']').join('') +
                    ' += ' +
                    solExpr(inst.data.left) +
                    ';'
                );
            } else if (
                inst.data.tag === 'Add' &&
                inst.data.left.tag === 'MappingLoad' &&
                inst.data.left.location === inst.location
            ) {
                return (
                    mappingName +
                    inst.items.map(item => sol`[${item}]`).join('') +
                    ' += ' +
                    solExpr(inst.data.right) +
                    ';'
                );
            } else if (
                inst.data.tag === 'Sub' &&
                inst.data.left.tag === 'MappingLoad' &&
                inst.data.left.location === inst.location
            ) {
                return (
                    mappingName +
                    inst.items.map(item => sol`[${item}]`).join('') +
                    ' -= ' +
                    solExpr(inst.data.right) +
                    ';'
                );
            } else {
                return (
                    mappingName +
                    inst.items.map(item => sol`[${item}]`).join('') +
                    ' = ' +
                    solExpr(inst.data) +
                    ';'
                );
            }
        }

        case 'Throw':
            return `throw('${inst.reason}');`;
    }
}

function isStringReturn(args: Expr[] | undefined): args is [Val, Val, Val] {
    return args?.length === 3 && args.every(arg => arg.isVal());
}

function hex2a(hexstr: string) {
    let str = '';
    for (let i = 0; i < hexstr.length && hexstr.slice(i, i + 2) !== '00'; i += 2) {
        str += String.fromCharCode(parseInt(hexstr.substring(i, i + 2), 16));
    }
    return str;
}

function getRevertMsg({ args }: { args?: Expr[] | undefined }, selector: string): string | undefined {
    args = args?.map(evalE);
    return selector === Revert.ERROR && isStringReturn(args) && args[0].val === 32n
        ? `"${hex2a(args[2].val.toString(16))}"`
        : undefined;
}

function solStmt(stmt: Stmt): string {
    switch (stmt.name) {
        case 'If':
            return sol`(${stmt.condition})`;
        case 'CallSite':
            return sol`$${stmt.selector}();`;
        case 'Require': {
            const fnname = stmt.selector === Revert.PANIC ? 'assert' : 'require';
            const args = stmt.selector === undefined || stmt.selector === Revert.PANIC
                ? stmt.args
                : [new Val(BigInt('0x' + stmt.selector)), ...stmt.args];
            const revertMsg = getRevertMsg(stmt, Revert.ERROR);
            return revertMsg !== undefined
                ? sol`${fnname}(${stmt.condition}, ${revertMsg});`
                : `${fnname}(${[stmt.condition, ...args].map(solExpr).join(', ')});`;
        }
        default:
            return solInst(stmt);
    }
}

/**
 *
 * @param stmts
 * @param spaces
 * @returns
 */
export function solStmts(stmts: Stmt[], spaces = 0): string {
    let text = '';
    for (const stmt of stmts) {
        if (stmt instanceof If) {
            const condition = solStmt(stmt);
            text += ' '.repeat(spaces) + 'if ' + condition + ' {\n';
            text += solStmts(stmt.trueBlock!, spaces + 4);
            if (stmt.falseBlock) {
                text += ' '.repeat(spaces) + '} else {\n';
                text += solStmts(stmt.falseBlock, spaces + 4);
            }
            text += ' '.repeat(spaces) + '}\n';
        } else {
            if (stmt.name === 'Local' && stmt.local.nrefs <= 0) {
                continue;
            }
            if (stmt.name === 'MStore') {
                continue;
            }
            text += ' '.repeat(spaces) + solStmt(stmt) + '\n';
        }
    }

    return text;
}

/**
 *
 * @param events
 * @returns
 */
export function solEvents(events: IEvents, spaces = 0) {
    let text = '';

    for (const [topic, event] of Object.entries(events)) {
        text += ' '.repeat(spaces) + 'event ';
        if (event.sig === undefined) {
            text += topic;
        } else {
            const eventName = event.sig.split('(')[0];
            const params = event.sig.replace(eventName, '').substring(1).slice(0, -1);
            if (params) {
                text += eventName + '(';
                text += params.split(',').map((param, i) =>
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
    [...variables.entries()].forEach(([hash, variable], index) => {
        const types: string[] = variable.types
            .map(expr => (expr.isVal() ? 'uint256' : expr.type ?? ''))
            .filter(t => t.trim() !== '');
        if (types.length === 0) {
            types.push('unknown');
        }
        const name = variable.label ? ` public ${variable.label}` : ` var${index + 1}__${variable.index}`;
        output += `    ${[...new Set(types)].join('|') + name}; // Slot #${hash}\n`;
    });

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
        const label = mapping.name ? `public ${mapping.name}` : `mapping${index + 1}`;
        output += `    ${solMapping(mapping)} ${label};\n`;
    });

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
                                return items.slice(1);
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

/**
 *
 * @returns the decompiled text for `this` function.
 */
function solPublicFunction(self: PublicFunction, tab = '    '): string {
    let output = tab + 'function ' + (self.label !== undefined
        ? fnsig(parseSig(self.label))
        : `${self.selector}(/*no signature*/)`) + ' ' + self.visibility;
    if (self.constant) output += ' view';
    if (self.payable) output += ' payable';
    if (self.returns.length > 0) output += ` returns (${self.returns.join(', ')})`;

    output += ' {\n';
    output += solStmts(self.stmts, 8);
    output += tab + '}\n\n';
    return output;
}

function solReverts(reverts: IReverts): string {
    let output = '';
    for (const [selector, decl] of Object.entries(reverts) as [string, IReverts[string]][]) {
        if (!Revert.isRequireOrAssert(selector)) {
            if (decl.sig === undefined)
                output += `    // error ${selector}\n`;
            else
                output += `    error ${decl.sig}; // ${selector}\n`;
        }
    }

    return output;
}

function solContract(
    this: Contract,
    options: { license?: string | null; pragma?: boolean; contractName?: string } = {}
): string {
    const { license = 'UNLICENSED', pragma = true, contractName = 'Contract' } = options;

    let text = '';

    if (license) {
        text += `// SPDX-License-Identifier: ${license}\n`;
    }
    if (pragma && this.metadata) {
        text += `// Metadata ${this.metadata.url}\n`;
        text += `pragma solidity ${this.metadata.solc};\n`;
        text += '\n';
    }

    text += `contract ${contractName} {\n\n`;

    const member = (text: string) => text === '' ? '' : text + '\n';

    text += member(solEvents(this.events, 4));
    text += solStructs(this.mappings);
    text += member(solMappings(this.mappings));
    text += member(solVars(this.variables));
    text += member(solReverts(this.reverts));

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const fallback = this.metadata?.minor! >= 6 ? 'fallback' : 'function';
    text += ' '.repeat(4) + `${fallback}() external payable {\n`;
    text += solStmts(this.main, 8);
    text += ' '.repeat(4) + '}\n\n';
    for (const [, fn] of Object.entries(this.functions)) {
        text += solPublicFunction(fn);
    }
    text += '}\n';

    return text;
}

declare module '.' {
    interface Contract {
        /**
         * Decompiles the `Contract` into Solidity-like source code.
         */
        solidify(...args: Parameters<typeof solContract>): string;
    }
}

declare module './ast' {
    interface Tag {
        /**
         */
        sol(): string;
    }
}

Contract.prototype.solidify = solContract;

Tag.prototype.sol = function (this: Expr) {
    return solExpr(this);
};
