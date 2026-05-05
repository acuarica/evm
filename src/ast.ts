


function renderBlock(pc: number, indent: number) {
    const p = new Printer();
    const [block] = bbs.get(pc)!;
    console.log(' '.repeat(indent) + p.c.yellow('block_' + pc), block.params.length, '|= ' + block.params.map(e => p.strExpr(e)).join(' | ') + '');
    // console.log('  ', block.id)
    // console.log('visited', visits.get(pc)!.count)
    for (const inst of block.insts) {
        console.log(' '.repeat(indent) + `${p.strInst(inst)}`);
    }
    const un = '|= unused ' + `${block.unused.map(e => p.strExpr(e)).join(' | ')}`;
    // console.log('  ->', block.targets, '|= outs', `${block.outs.map(e => p.strExpr(e)).join(' | ')}`, un);
    for (const pcdest of block.targets) {
        const t = bbs.get(pcdest.pc);
        assert(t !== undefined);
        // if (t.params.length > block.outs.length) {
        //     console.log('  not enough args');
        // }
    }
}

function renderAst(blocks: { pc: number }[], indent = 0) {

    for (const b of blocks) {
        renderBlock(b.pc, indent);
        if ('inst' in b && b.inst === 'if') {
            if ('tb' in b)
                renderAst(b.tb, indent + 2);
            if ('fb' in b) {
                console.log(' '.repeat(indent) + 'else');
                renderAst(b.fb, indent + 2);
            }
        }
    }
}

function part(xs: number[]) {
    const cont = [];
    const nested = [];
    for (const x of xs) {
        if (preds.get(x)!.size >= 2) {
            cont.push(x);
        } else {
            nested.push(x);
        }
    }
    return { nested, cont };
}

function ast(node: number): unknown[] {
    const xs = tree.get(node);
    if (xs === undefined) {
        return [{ inst: node, pc: node }];
    }
    const { nested, cont } = part(xs);
    const blocks = [];
    if (nested.length === 1) {
        blocks.push({ inst: 'if', pc: node, tb: ast(nested[0]) });
    } else if (nested.length === 2) {
        blocks.push({ inst: 'if', pc: node, tb: ast(nested[0]), fb: ast(nested[1]) });
    }
    if (cont.length > 0) {
        blocks.push(...ast(cont[0]));
    }
    return blocks;
}


