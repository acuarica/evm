
export class Printer {
    readonly #opts;
    constructor(opts: {
        expandSingleCopyLocal?: true,
        expandArgParam?: true,
        inlineSingleUseLocal?: true,
        showPcNumber?: true,
    } = {}) {
        this.#opts = opts;
    }

    strExpr(expr: unknown): string {
        if (expr instanceof Lit)
            return `${expr.value}n`;
        else if (expr instanceof SExpr)
            return `${expr.ex}(${expr.args.map(e => this.strExpr(e)).join(', ')})`;
        else if (expr instanceof Param)
            return `$${expr.id}_${expr.trigger}${expr.index}` + (expr.props['jumpdest'] ? '*jd' : '') + (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
        else if (expr instanceof Local) {
            if (this.#opts.inlineSingleUseLocal && expr.copies === 1 && expr.uses === 1) {
                return this.strExpr(expr.expr);
            }
            return `%${expr.id}` + (this.#opts.expandSingleCopyLocal && expr.copies === 1 ? `:${this.strExpr(expr.expr)}` : '');
        } else
            return `${expr}`;
    }

    strInst(inst: unknown): string {
        const pc = this.#opts.showPcNumber
            ? () => ' // :' + (inst as Inst).pc
            : () => '';
        if (inst instanceof Def) {
            const g = inst.local.props['global'] !== undefined ? `_${inst.local.props['global']}` : '';
            const t = (inst.local.props['rettarget'] ? 'rettarget' : '');
            return `%${inst.local.id}${g}` + `|${inst.local.copies}:${inst.local.uses}` + ` := ${this.strExpr(inst.local.expr)}${pc()}` + t;
        } else if (inst instanceof Inst) {
            const r = inst.props['isret'] ? ' ret' : '';
            return `${inst.fn}(` + inst.args.map(e => this.strExpr(e)).join(', ') + ')' + `${pc()}` + r;
        } else {
            return `${inst}`;
        }
    }
}

class Props {
    readonly props: { [prop: string]: unknown } = {};
}

export class SExpr extends Props {
    readonly ex: string;
    readonly args: Local[];
    constructor(ex: string, args: Local[]) {
        super();
        this.ex = ex;
        this.args = args;
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.args.map(e => e.expr)[Symbol.iterator]();
    }
}

export class Local extends Props {
    readonly id: number;
    readonly expr: SExpr;
    copies: number = 1;
    uses: number = 0;
    constructor(id: number, expr: SExpr) {
        super();
        this.id = id;
        this.expr = expr;
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.expr.args.map(e => e.expr)[Symbol.iterator]();
    }
}

export class Lit extends SExpr {
    readonly value: bigint;
    constructor(value: bigint) {
        super('lit', []);
        this.value = value;
    }
}

export class Param extends Local {
    readonly trigger: 'pop' | 'dup' | 'swap';
    readonly index: number;
    readonly arg: Local | undefined;
    constructor(id: number, trigger: Param['trigger'], index: number, arg: Local | undefined) {
        super(id, new SExpr(trigger, []));
        this.trigger = trigger;
        this.index = index;
        this.arg = arg;
        if (arg !== undefined) {
            arg.props['global'] = index + trigger + id;
        }
    }
}

export class Inst extends Props {
    readonly fn: string;
    readonly args: Local[];
    readonly pc: number;
    constructor(fn: string, args: Local[], pc: number) {
        super();
        this.fn = fn;
        this.args = args;
        this.pc = pc;
    }
}

export class Def extends Inst {
    readonly local: Local;
    constructor(local: Local, pc: number) {
        super('local', [], pc);
        this.local = local;
        local.props['pc'] = pc;
    }
}