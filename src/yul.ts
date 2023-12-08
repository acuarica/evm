import type { MappingLoad, MappingStore } from './ast';
import { isExpr, type Expr, type Inst, isInst } from './ast/expr';
import type { Stmt } from './stmt';

/**
 * Returns the Yul `string` representation of `nodes` that are either
 * `Expr`essions or `Inst`ructions.
 *
 * https://docs.soliditylang.org/en/v0.8.21/yul.html
 */
export function yul(strings: TemplateStringsArray, ...nodes: unknown[]): string {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        const str = isExpr(node) ? yulExpr(node) : isInst(node) ? yulInst(node) : `${node}`;
        result.push(str, strings[i + 1]);
    });
    return result.join('');
}

function yulExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val':
            return `0x${expr.val.toString(16)}`;
        case 'Local':
            return expr.nrefs > 0 ? `local${expr.index}` : yul`${expr.value}`;
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
            return expr.value;
        case 'Fn':
            throw new Error('');
        case 'DataCopy':
            throw new Error('Not implemented yet: "DataCopy" case');
        case 'MLoad':
            return yul`mload(${expr.loc})`;
        case 'Sha3':
            return yul`keccak256(${expr.offset}, ${expr.size})`;
        case 'Create': // create(v, p, n) | F | create new contract with code mem[p…(p+n)) and send v wei and return the new address; returns 0 on error
            return yul`create(${expr.value}, ${expr.offset}, ${expr.size})`;
        case 'Call': // call(g, a, v, in, insize, out, outsize) | F | call contract at address a with input mem[in…(in+insize)) providing g gas and v wei and output area mem[out…(out+outsize)) returning 0 on error (eg. out of gas) and 1 on success See more
            throw new Error('Not implemented yet: "Call" case');
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
            throw new Error('Not implemented yet: "DelegateCall" case');
        case 'SLoad':
            return yul`sload(${expr.location})`;
        case 'MappingLoad':
            return yul`sload(${expr.location}/*${yulMapArgs(expr)}*/)`;
    }
}

function yulInst(inst: Inst): string {
    switch (inst.name) {
        case 'Local':
            return yul`${inst.local.value.type} local${inst.local.index} = ${inst.local.value} // #refs ${inst.local.nrefs}`;
        case 'Log':
            return yul`log${inst.topics.length}(${inst.offset}, ${inst.size}, ${inst.topics
                .map(yulExpr)
                .join(', ')})`;
        case 'MStore':
            return yul`mstore(${inst.location}, ${inst.data})`;
        case 'Stop':
            return 'stop()';
        case 'Return':
            return yul`return(${inst.offset}, ${inst.size})`;
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
            throw new Error('Not implemented yet: "SigCase" case');
        case 'SStore':
            return yul`sstore(${inst.location}, ${inst.data})`;
        case 'MappingStore':
            return yul`sstore(${inst.slot}, ${inst.data}) /*${inst.location}${yulMapArgs(inst)}*/`;
        case 'Throw':
            throw new Error('Not implemented yet: "Throw" case');
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

export function yulStmts(stmts: Stmt[]): string {
    return stmts
        .filter(s => s.name !== 'Local' || s.local.nrefs > 0)
        .map(yulStmt)
        .join('\n');
}
