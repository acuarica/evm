import type { Block } from './sevm.ts';

export function buildAST(bbs: Map<number, Block[]>) {
    const preds = f(bbs);
    const { tree } = domTree(preds);
    return ast(0, tree, preds);
}

function part(xs: number[], preds: Map<number, Set<number>>) {
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

function ast(node: number, tree: Map<number, number[]>, preds: Map<number, Set<number>>): unknown[] {
    const xs = tree.get(node);
    if (xs === undefined) {
        return [{ inst: node, pc: node }];
    }
    const { nested, cont } = part(xs, preds);
    const blocks = [];
    if (nested.length === 1) {
        blocks.push({ inst: 'if', pc: node, tb: ast(nested[0], tree, preds) });
    } else if (nested.length === 2) {
        blocks.push({ inst: 'if', pc: node, tb: ast(nested[0], tree, preds), fb: ast(nested[1], tree, preds) });
    }
    if (cont.length > 0) {
        blocks.push(...ast(cont[0], tree, preds));
    }
    return blocks;
}

function domTree(cfg: Map<number, Set<number>>) {
    const doms = new Map<number, Set<number>>();
    doms.set(0, new Set([0]))

    for (const pc of cfg.keys()) {
        if (pc !== 0) {
            doms.set(pc, new Set(cfg.keys()));
        }
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const [key] of cfg.entries()) {
            if (key !== 0) {
                if (cfg.get(key) === undefined)
                    continue;

                const ds = union(
                    new Set([key]),
                    intersect([...cfg.get(key)!].map(pred => doms.get(pred)!))
                );
                if (!equal(ds, doms.get(key)!)) {
                    doms.set(key, ds);
                    changed = true;
                }
            }
        }
    }

    {
        const xss = [...doms.entries()];
        xss.sort(([, xs], [, ys]) => xs.size - ys.size);
        const tree = new Map<number, number[]>();

        const seen = [];
        for (const [x, xs] of xss) {
            for (const s of seen) {
                if (xs.has(s)) {
                    let node = tree.get(s);
                    if (node === undefined) {
                        node = [];
                        tree.set(s, node);
                    }
                    node.push(x);
                    break;
                }
            }
            seen.unshift(x);
        }

        return { doms, tree };
    }

    function union<T>(left: Set<T>, right: Set<T>) {
        return new Set([...left, ...right]);
    }

    function intersect<T>(sets: Set<T>[]) {
        let result = sets[0];
        for (let i = 1; i < sets.length; i++) {
            result = _intersect(result, sets[i]);
        }
        return result;
    }

    function _intersect<T>(left: Set<T>, right: Set<T>) {
        return new Set([...left].filter(elem => right.has(elem)));
    }

    function equal<T>(left: Set<T>, right: Set<T>) {
        return left.size === right.size && [...left].every(elem => right.has(elem));
    }
}

function f(bbs: Map<number, Block[]>) {
    const cfg = new Map<number, Set<number>>();

    for (const [pc, bs] of bbs.entries()) {
        for (const b of bs) {
            for (const t of b.targets) {
                let entry = cfg.get(t.pc);
                if (entry === undefined) {
                    entry = new Set();
                    cfg.set(t.pc, entry);
                }
                entry.add(pc);
            }
        }
    }

    return cfg;
}