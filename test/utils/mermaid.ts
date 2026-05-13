import { Block, Printer } from '../../src/sevm.ts';

export function mermaid(bbs: Map<number, Block[]>, title: string): string {
    const m = new Mermaid(title);
    const p = new Printer();

    for (const [pc, bs] of bbs.entries()) {
        const sg = m.subgraph(`block_${pc}`, `pc ${pc}`);
        for (const b of bs) {
            const entry = pc === 0;
            const [open, close] = entry ? ['[[', ']]'] : ['(', ')'];
            const sid = 's_' + b.id;
            const params = b.params.map(e => p.strExpr(e)).join(' | ');
            const un = '|= unused ' + `${b.unused.map(e => p.strExpr(e)).join(' | ')}`;
            const outs = `${b.outs.map(e => p.strExpr(e)).join(' | ')}`;
            const label = `${sid}(${params})\n${outs} || ${un}`;

            sg.line(`    ${sid}${open}"${label}"${close}`);
            sg.line(`    class ${sid} state`);

            for (const t of b.targets) {
                const d = t.dynamic ? '==' : '--';
                m.link(sid, `${d}${t.pushpc}${d}>`, 's_' + t.args!.id);
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