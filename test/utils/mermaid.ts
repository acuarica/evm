import { Block, Printer } from '../../src/fork.ts';

export function mermaid(bbs: Map<number, Block[]>, title: string): string {
    const m = new Mermaid(title);
    const p = new Printer();

    for (const [pc, bs] of bbs.entries()) {
        const sg = m.subgraph(`block_${pc}`, `pc ${pc}`);
        for (const b of bs) {
            const entry = pc === 0;
            const [open, close] = entry ? ['[[', ']]'] : ['(', ')'];
            const sid = 's_' + b.id;
            const label = `id ${sid}`// + b.insts.map(i => p.strInst(i)).join('\n');
            sg.line(`    ${sid}${open}"${label}"${close}`);
            sg.line(`    class ${sid} state`);

            for (const t of b.targets) {
                const d = t.dynamic ? '==' : '--';
                m.link(sid, `${d}${t.pushpc}${d}>`, 's_' + t.args.id);
            }
        }
    }

    return m.diagram();
}

export function mermaid2(bbs: Map<number, Set<number>>): string {
    const m = new Mermaid('asdf');

    for (const [pc, bs] of bbs.entries()) {
        const sg = m.subgraph(`block_${pc}`, `pc ${pc}`);
        const sid = 's_' + pc;
        const label = `id ${sid}`// + b.insts.map(i => p.strInst(i)).join('\n');
        sg.line(`    ${sid}("${label}")`);
        for (const b of bs) {
            if (b !== pc)
                m.link(sid, `--1-->`, 's_' + b);
        }
    }

    return m.diagram();
}

export function mermaidTree(tree: Map<number, number[]>): string {
    const m = new Mermaid('asdf tree');

    for (const [node, xs] of tree.entries()) {
        const sid = 's_' + node;
        const label = `n ${sid}`// + b.insts.map(i => p.strInst(i)).join('\n');
        m.line(`    ${sid}("${label}")`);
        for (const x of xs) {
            m.link(sid, `--->`, 's_' + x);
        }
    }

    return m.diagram();
}

export function f(bbs: Map<number, Block[]>) {
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

class Mermaid {
    readonly #title: string;
    readonly #subgraphs: Subgraph[] = [];
    #output: string = '';
    #links: string = '';

    constructor(title: string) {
        this.#title = title;
    }

    line(line: string): void {
        this.#output += line + '\n';
    }

    link(srcId: string, arrow: string, destId: string) {
        this.#links += `  ${srcId} ${arrow} ${destId}\n`;
    }

    subgraph(id: string, title: string): Subgraph {
        const sg = new Subgraph(id, title);
        this.#subgraphs.push(sg);
        return sg;
    }

    diagram(): string {
        let output = '';
        const line = (line: string) => output += line + '\n';

        line('---');
        line(`title: ${this.#title}`);
        line('---');
        line('flowchart TD');
        line(`  classDef state text-align:left`);
        output += this.#output;
        for (const sg of this.#subgraphs) {
            line(`  subgraph ${sg.id} ["${sg.title}"]`);
            output += sg.get();
            line('  end');
        }
        return output + this.#links;
    }
}

class Subgraph {
    readonly id: string;
    readonly title: string;
    #output: string = '';

    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }

    line(line: string): void {
        this.#output += line + '\n';
    }

    get(): string {
        return this.#output;
    }
}

export function domTree(cfg: Map<number, Set<number>>) {
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
        console.log(xss);
        console.log(tree);

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