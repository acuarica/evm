import { Branch, type MappingLoad, type MappingStore } from './ast';
import { isExpr, type Expr, type Inst, isInst } from './ast/expr';
import type { State } from './state';

/**
 * Returns the Yul `string` representation of `nodes` that are either
 * `Expr`essions or `Inst`ructions.
 *
 * https://docs.soliditylang.org/en/v0.8.21/yul.html
 */
export function huff(strings: TemplateStringsArray, ...nodes: unknown[]): string {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        const str = isExpr(node) ? huffExpr(node) : isInst(node) ? huffInst(node) : `${node}`;
        result.push(str, strings[i + 1]);
    });
    return result.join('');
}

function huffExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val':
            return `0x${expr.val.toString(16)}`;
        case 'Local':
            return expr.nrefs > 0 ? `local${expr.index}` : huff`l${expr.index}\`${expr.value}`;
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
            return huff`${expr.right} ${expr.left} ${expr.tag.toLowerCase()}`;
        case 'IsZero':
        case 'Not':
            return huff`${expr.value} ${expr.tag.toLowerCase()}`;
        case 'Byte':
            return huff`byte(${expr.pos}, ${expr.data})`;
        case 'Shl':
        case 'Shr':
        case 'Sar':
            return huff`${expr.value} ${expr.shift} ${expr.tag.toLowerCase()}`;
        case 'Sig':
            return `eq(msg.sig, ${expr.selector})`;
        case 'CallValue':
            return 'callvalue';
        case 'CallDataLoad':
            return huff`${expr.location} calldataload`;
        case 'Prop':
            return expr.value;
        case 'Fn':
            throw new Error('');
        case 'DataCopy':
            throw new Error('Not implemented yet: "DataCopy" case');
        case 'MLoad':
            return huff`mload(${expr.loc})`;
        case 'Sha3':
            return huff`keccak256(${expr.offset}, ${expr.size})`;
        case 'Create': // create(v, p, n) | F | create new contract with code mem[p…(p+n)) and send v wei and return the new address; returns 0 on error
            return huff`create(${expr.value}, ${expr.offset}, ${expr.size})`;
        case 'Call': // call(g, a, v, in, insize, out, outsize) | F | call contract at address a with input mem[in…(in+insize)) providing g gas and v wei and output area mem[out…(out+outsize)) returning 0 on error (eg. out of gas) and 1 on success See more
            throw new Error('Not implemented yet: "Call" case');
        case 'ReturnData':
            throw new Error('Not implemented yet: "ReturnData" case');
        case 'CallCode':
            throw new Error('Not implemented yet: "CallCode" case');
        case 'Create2': // create2(v, p, n, s) | C | create new contract with code mem[p…(p+n)) at address keccak256(0xff . this . s . keccak256(mem[p…(p+n))) and
            // send v wei and return the new address, where 0xff is a 1 byte value,
            // this is the current contract’s address as a 20 byte value and s is a big-endian 256-bit value; returns 0 on error
            return huff`create2(${expr.value}, ${expr.offset}, ${expr.size})`;
        case 'StaticCall': // staticcall(g, a, in, insize, out, outsize)
            return huff`staticcall(${expr.gas}, ${expr.address}, ${expr.memoryStart}, ${expr.memoryLength}, ${expr.outputStart}, ${expr.outputLength})`;
        case 'DelegateCall':
            throw new Error('Not implemented yet: "DelegateCall" case');
        case 'SLoad':
            return huff`sload(${expr.location})`;
        case 'MappingLoad':
            return huff`sload(${expr.location}/*${huffMapArgs(expr)}*/)`;
    }
}

function huffInst(inst: Inst): string {
    switch (inst.name) {
        case 'Local':
            return huff`${inst.local.value} dup //${inst.local.value.type} local${inst.local.index} = ${inst.local.value} // #refs ${inst.local.nrefs}`;
        case 'Log':
            return huff`log${inst.topics.length}(${inst.offset}, ${inst.size}, ${inst.topics
                .map(huffExpr)
                .join(', ')})`;
        case 'MStore':
            return huff`${inst.data} ${inst.location} mstore`;
        case 'Stop':
            return 'stop()';
        case 'Return':
            return huff`${inst.size} ${inst.offset} return`;
        case 'Revert':
            return huff`${inst.size} ${inst.offset} ${inst.args?.map(huffExpr).join(',')} revert`;
        case 'SelfDestruct':
            return huff`selfdestruct(${inst.address})`;
        case 'Invalid':
            return 'invalid()';
        case 'Jump':
            return huff`jump(${inst.offset}, ${inst.destBranch.pc})`;
        case 'Jumpi':
            return huff`${inst.cond} ${inst.offset} jumpi // ${inst.destBranch.pc}`;
        case 'JumpDest':
            return `jumpdesp(${inst.fallBranch.pc})`;
        case 'SigCase':
            return huff`sigcase(${inst.condition}, ${inst.offset})`;
        case 'SStore':
            return huff`sstore(${inst.location}, ${inst.data})`;
        case 'MappingStore':
            return huff`sstore(${inst.slot}, ${inst.data}) /*${inst.location}${huffMapArgs(
                inst
            )}*/`;
        case 'Throw':
            throw new Error('Not implemented yet: "Throw" case');
    }
}

function huffMapArgs(mapping: MappingLoad | MappingStore): string {
    return mapping.items.map(e => huff`[${e}]`).join('');
}

export function huffInsts(stmts: Inst[]): string {
    return stmts
        .filter(s => s.name !== 'Local' || s.local.nrefs > 0)
        .map(huffInst)
        .join('\n');
}

export function huffState(entry: State<Inst, Expr>): string {
    const states = [new Branch(0, entry)];
    const visited = new WeakSet();

    let s = '';

    while (states.length > 0) {
        const b = states.shift()!;
        const state = b.state;
        if (visited.has(state)) {
            continue;
        }
        visited.add(state);

        s += `${b.pc}:\n`;
        s += state.stmts
            // .filter(s => s.name !== 'Local' || s.local.nrefs > 0)
            .map(huffInst)
            .map(line => `    ${line}\n`)
            .join('');

        switch (state.last?.name) {
            case 'Jump':
                states.unshift(state.last?.destBranch);
                break;
            case 'Jumpi':
                states.unshift(state.last?.destBranch);
                states.unshift(state.last?.fallBranch);
                break;
            case 'SigCase':
                states.unshift(state.last?.fallBranch);
                break;
            default:
        }
    }

    return `#define macro MAIN() = takes(?) returns (?) {\n${s}}`;
}
