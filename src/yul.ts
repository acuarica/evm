import { type Expr, type Inst } from './ast/expr';

const isExpr = (expr: unknown): expr is Expr =>
    expr !== null && typeof expr === 'object' && 'tag' in expr;
const isInst = (inst: unknown): inst is Inst =>
    inst !== null && typeof inst === 'object' && 'name' in inst;

/**
 * Returns the Yul string representation of `this` `Expr`ession.
 *
 * https://docs.soliditylang.org/en/latest/yul.html
 */
export function yul(strings: TemplateStringsArray, ...nodes: unknown[]) {
    const result = [strings[0]];
    nodes.forEach((node, i) => {
        const str = isExpr(node) ? yulExpr(node) : isInst(node) ? yulInst(node) : `${node}`;
        result.push(str, strings[i + 1]);
    });
    return result.join('');
}

// prettier-ignore
function yulExpr(expr: Expr): string {
    switch (expr.tag) {
        case 'Val': return `${expr.val}`;
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
        case 'Xor': return yul`${expr.tag.toLowerCase()}(${expr.left}, ${expr.right})`;
        case 'IsZero':
        case 'Not': return yul`${expr.tag.toLowerCase()}(${expr.value})`;
        case 'Byte': return yul`byte(${expr.pos}, ${expr.data})`;
        case 'Shl':
        case 'Shr':
        case 'Sar': return yul`${expr.tag.toLowerCase()}(${expr.value}, ${expr.shift})`;
        case 'Sig': throw new Error('Not implemented yet: "Sig" case');
        case 'CallValue': return `callvalue()`;
        case 'CallDataLoad': return `calldataload(${expr.location})`;
        case 'Prop': return expr.value;
        case 'Fn': throw new Error('');
        case 'DataCopy': throw new Error('Not implemented yet: "DataCopy" case');
        case 'MLoad': throw new Error('Not implemented yet: "MLoad" case');
        case 'Sha3': throw new Error('Not implemented yet: "Sha3" case');
        case 'Create': throw new Error('Not implemented yet: "Create" case');
        case 'Call': throw new Error('Not implemented yet: "Call" case');
        case 'ReturnData': throw new Error('Not implemented yet: "ReturnData" case');
        case 'CallCode': throw new Error('Not implemented yet: "CallCode" case');
        case 'Create2': throw new Error('Not implemented yet: "Create2" case');
        case 'StaticCall': throw new Error('Not implemented yet: "StaticCall" case');
        case 'DelegateCall': throw new Error('Not implemented yet: "DelegateCall" case');
        case 'SLoad': throw new Error('Not implemented yet: "SLoad" case');
        case 'MappingLoad': throw new Error('Not implemented yet: "MappingLoad" case');
    }
}

// prettier-ignore
function yulInst(inst: Inst): string {
    switch (inst.name) {
        case 'Log': return `log${inst.topics.length}(${inst.mem.offset}, ${inst.topics
            .map(yulExpr)
            .join(', ')});`;
        case 'MStore': throw new Error('Not implemented yet: "MStore" case');
        case 'Stop': return `stop()`;
        case 'Return': throw new Error('Not implemented yet: "Return" case');
        case 'Revert': throw new Error('Not implemented yet: "Revert" case');
        case 'SelfDestruct': return yul`selfdestruct(${inst.address})`;
        case 'Invalid': throw new Error('Not implemented yet: "Invalid" case');
        case 'Jump': throw new Error('Not implemented yet: "Jump" case');
        case 'Jumpi': throw new Error('Not implemented yet: "Jumpi" case');
        case 'JumpDest': throw new Error('Not implemented yet: "JumpDest" case');
        case 'SigCase': throw new Error('Not implemented yet: "SigCase" case');
        case 'SStore': throw new Error('Not implemented yet: "SStore" case');
        case 'MappingStore': throw new Error('Not implemented yet: "MappingStore" case');
        case 'Throw': throw new Error('Not implemented yet: "Throw" case');
    }
}
