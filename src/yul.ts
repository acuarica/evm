import { Contract } from '.';
import type { Expr, Inst, MappingLoad, MappingStore, Stmt } from './ast';
import { FNS, Tag, isExpr, isInst } from './ast';

/**
 * Returns the Yul `string` representation of `nodes` that are either
 * `Expr`essions or `Inst`ructions.
 *
 * https://docs.soliditylang.org/en/v0.8.21/yul.html
 */
export function yul(strings: TemplateStringsArray, ...nodes: unknown[]): string {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const str = isExpr(node) ? yulExpr(node) : isInst(node) ? yulInst(node) : `${node}`;
        result.push(str, strings[i + 1]);
    });
    return result.join('');
}

function yulExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val':
            // return `0x${expr.val.toString(16)}`;
            return `${expr.isJumpDest() ? '[J]' : ''}0x${expr.val.toString(16)}`;
        case 'Local':
            return `local${expr.index}`;
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
        case 'Xor':
            return yul`${expr.tag.toLowerCase()}(${expr.left}, ${expr.right})`;
        case 'IsZero':
        case 'Not':
            return yul`${expr.tag.toLowerCase()}(${expr.value})`;
        case 'Byte':
            return yul`byte(${expr.pos}, ${expr.data})`;
        case 'Shl':
        case 'Shr':
        case 'Sar':
            return yul`${expr.tag.toLowerCase()}(${expr.value}, ${expr.shift})`;
        case 'Sig':
            return `eq(msg.sig, ${expr.selector})`;
        case 'CallValue':
            return 'callvalue()';
        case 'CallDataLoad':
            return yul`calldataload(${expr.location})`;
        case 'Prop':
            switch (expr.symbol) {
                case 'msg.sender': return 'caller()';
                case 'msg.data.length': return 'calldatasize()';
                case 'msize()': return expr.symbol;
                default: {
                    const i = expr.symbol.indexOf('.');
                    return (i >= -1 ? expr.symbol.substring(i + 1) : expr.symbol) + '()';
                }
            }
        case 'Fn':
            return FNS[expr.mnemonic][0](yulExpr(expr.value));
        case 'DataCopy':
            switch (expr.kind) {
                case 'calldatacopy':
                    return yul`calldatacopy(${expr.offset}, ${expr.size})`;
                case 'codecopy':
                    return yul`codecopy(${expr.offset}, ${expr.size})`;
                case 'extcodecopy':
                    return yul`extcodecopy(${expr.address}, ${expr.offset}, ${expr.size})`;
                case 'returndatacopy':
                    return yul`returndatacopy(${expr.offset}, ${expr.size})`;
            }
        case 'MLoad':
            return yul`mload(${expr.location})`;
        case 'Sha3':
            return yul`keccak256(${expr.offset}, ${expr.size} /*${expr.args?.map(yulExpr).join('.') ?? 'no args'}*/)`;
        case 'Create': // create(v, p, n) | F | create new contract with code mem[p…(p+n)) and send v wei and return the new address; returns 0 on error
            return yul`create(${expr.value}, ${expr.offset}, ${expr.size})`;
        case 'Call': // call(g, a, v, in, insize, out, outsize) | F | call contract at address a with input mem[in…(in+insize)) providing g gas and v wei and output area mem[out…(out+outsize)) returning 0 on error (eg. out of gas) and 1 on success See more
            return yul`call(${expr.gas},${expr.address},${expr.value},${expr.argsStart},${expr.argsLen},${expr.retStart},${expr.retLen})`;
        case 'ReturnData':
            throw new Error('Not implemented yet: "ReturnData" case');
        case 'CallCode':
            throw new Error('Not implemented yet: "CallCode" case');
        case 'Create2': // create2(v, p, n, s) | C | create new contract with code mem[p…(p+n)) at address keccak256(0xff . this . s . keccak256(mem[p…(p+n))) and
            // send v wei and return the new address, where 0xff is a 1 byte value,
            // this is the current contract’s address as a 20 byte value and s is a big-endian 256-bit value; returns 0 on error
            return yul`create2(${expr.value}, ${expr.offset}, ${expr.size})`;
        case 'StaticCall': // staticcall(g, a, in, insize, out, outsize)
            return yul`staticcall(${expr.gas}, ${expr.address}, ${expr.memoryStart}, ${expr.memoryLength}, ${expr.outputStart}, ${expr.outputLength})`;
        case 'DelegateCall':
            return yul`delegatecall(${expr.gas},${expr.address},${expr.memoryStart},${expr.memoryLength},${expr.outputStart},${expr.outputLength})`;
        case 'SLoad':
            return yul`sload(${expr.slot})`;
        case 'MappingLoad':
            return yul`sload(${expr.slot}/*base${expr.location}${yulMapArgs(expr)}*/)`;
    }
}

function yulInst(inst: Inst): string {
    switch (inst.name) {
        case 'Local':
            return yul`let local${inst.local.index} = ${inst.local.value} // #refs ${inst.local.nrefs}`;
        case 'Log':
            return yul`log${inst.topics.length}(${[
                inst.offset, inst.size, ...inst.topics
            ].map(yulExpr).join(', ')})`;
        case 'MStore':
            return yul`mstore(${inst.location}, ${inst.data})`;
        case 'Stop':
            return 'stop()';
        case 'Return':
            return yul`return(${inst.offset}, ${inst.size}) // ${inst.args?.map(yulExpr).join('.')}`;
        case 'Revert':
            return yul`revert(${inst.offset}, ${inst.size})`;
        case 'SelfDestruct':
            return yul`selfdestruct(${inst.address})`;
        case 'Invalid':
            return 'invalid()';
        case 'Jump':
            return yul`jump(${inst.offset}, ${inst.destBranch.pc})`;
        case 'Jumpi':
            return yul`jumpi(${inst.cond}, ${inst.offset}})`;
        case 'JumpDest':
            return `jumpdesp(${inst.fallBranch.pc})`;
        case 'SigCase':
            return yul`case when ${inst.condition} goto ${inst.offset} or fall ${inst.fallBranch.pc}`;
        case 'SStore':
            return yul`sstore(${inst.slot}, ${inst.data})`;
        case 'MappingStore':
            return yul`sstore(${inst.slot}, ${inst.data}) /*${inst.location}${yulMapArgs(inst)}*/`;
        case 'Throw':
            return `throw('${inst.reason}');`;
    }
}

function yulStmt(stmt: Stmt): string {
    switch (stmt.name) {
        case 'If':
            return yul`(${stmt.condition})`;
        case 'CallSite':
            return yul`$${stmt.selector}();`;
        case 'Require':
            return `require(${[stmt.condition, ...stmt.args].map(yulExpr).join(', ')});`;
        default:
            return yulInst(stmt);
    }
}

function yulMapArgs(mapping: MappingLoad | MappingStore): string {
    return mapping.items.map(e => yul`[${e}]`).join('');
}

export function yulStmts(stmts: Stmt[], spaces = 0): string {
    let text = '';
    for (const stmt of stmts) {
        if (stmt.name === 'If') {
            const condition = yulStmt(stmt);
            text += ' '.repeat(spaces) + 'if ' + condition + ' {\n';
            text += yulStmts(stmt.trueBlock!, spaces + 4);
            if (stmt.falseBlock) {
                text += ' '.repeat(spaces) + '} else {\n';
                text += yulStmts(stmt.falseBlock, spaces + 4);
            }
            text += ' '.repeat(spaces) + '}\n';
        } else {
            if (stmt.name === 'Local' && stmt.local.nrefs <= 0) {
                // continue;
            }
            if (stmt.name === 'MStore') {
                // continue;
            }
            text += ' '.repeat(spaces) + yulStmt(stmt) + '\n';
        }
    }

    return text;
}

declare module '.' {
    interface Contract {
        /**
         * @returns
         */
        yul(): string;
    }
}

Contract.prototype.yul = function (this: Contract) {
    let text = '';

    text += 'object "runtime" {\n';
    text += '    code {\n';
    text += yulStmts(this.main, 8);
    text += '\n';

    for (const [selector, fn] of Object.entries(this.functions)) {
        const name = fn.label ?? `__$${selector}(/*unknown*/)`;
        const view = fn.constant ? ' view' : '';
        const payable = fn.payable ? ' payable' : '';
        text += ' '.repeat(8) + `function ${name} { // public${view}${payable}\n`;
        text += yulStmts(fn.stmts, 12);
        text += ' '.repeat(8) + '}\n';
        text += '\n';
    }

    text += '    }\n';
    text += '}\n';

    return text;
};

declare module './ast' {
    interface Tag {
        /**
         */
        yul(): string;
    }
}

Tag.prototype.yul = function (this: Expr) {
    return yulExpr(this);
};
