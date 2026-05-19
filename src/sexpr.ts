
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
            // return `$${expr.pch}.${expr.id}_${expr.trigger}${expr.index}` + (expr.props['jumpdest'] ? '*jd' : '') + (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
            return `$${expr.pch}.${expr.id}` + (expr.jumpdest ? '*jd' : '') + (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
        else if (expr instanceof Local) {
            if (this.#opts.inlineSingleUseLocal && expr.copies === 1 && expr.uses === 1) {
                return this.strExpr(expr.expr);
            }
            const jd = expr.jumpdest === undefined ? '' : `*jd!${expr.jumpdest}`
            return `%${expr.pch}.${expr.id}${jd}` + (this.#opts.expandSingleCopyLocal && expr.copies === 1 ? `:${this.strExpr(expr.expr)}` : '');
        } else
            return `${expr}`;
    }

    strInst(inst: unknown): string {
        const pc = this.#opts.showPcNumber
            ? () => ' // :' + (inst as Inst).pc
            : () => '';
        if (inst instanceof Def) {
            const g = inst.local.global !== undefined ? `_$${inst.local.global}` : '';
            let t = (inst.local.rettarget ? 'rettarget' : '');
            t += inst.local.jumpdest ?? '';
            return `%${inst.local.pch}.${inst.local.id}${g}` + `|${inst.local.copies}:${inst.local.uses}` + ` := ${this.strExpr(inst.local.expr)}${pc()}` + t;
        } else if (inst instanceof Inst) {
            const r = inst.ret ? ' ret' : '';
            return `${inst.fn}(` + inst.args.map(e => this.strExpr(e)).join(', ') + ')' + `${pc()}` + r;
        } else {
            return `${inst}`;
        }
    }
}

export class SExpr {
    readonly ex: string;
    readonly args: Local[];
    constructor(ex: string, args: Local[]) {
        this.ex = ex;
        this.args = args;

        this.count = args.reduce((r, a) => r + a.expr.count, 1);
        if (this.count >= 30) {
            // console.log('sexpr count', this.count, this);
        }
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.args.map(e => e.expr)[Symbol.iterator]();
    }

    // readonly height: number;
    readonly count: number;

    toString(): string {
        return `${this.ex}(${this.args.map(e => `${e}`).join(', ')})`;
    }
}

export class Local {
    readonly pch: number;
    readonly id: number;
    readonly expr: SExpr;
    copies: number = 1;
    uses: number = 0;
    constructor(pch: number, id: number, expr: SExpr) {
        this.pch = pch;
        this.id = id;
        this.expr = expr;
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.expr.args.map(e => e.expr)[Symbol.iterator]();
    }

    global?: string;
    jumpdest?: 'direct' | 'indirect';
    pc?: number;
    rettarget?: boolean;

    toString(): string {
        const jd = this.jumpdest === undefined ? '' : `*jd!${this.jumpdest}`
        return `%${this.pch}.${this.id}${jd}`;//+ (this.#opts.expandSingleCopyLocal && expr.copies === 1 ? `:${this.strExpr(expr.expr)}` : '');
    }
}

export class Lit extends SExpr {
    readonly value: bigint;
    constructor(value: bigint) {
        super('lit', []);
        this.value = value;
    }

    override toString(): string {
        return `${this.value}n`;
    }
}

export class Param extends Local {
    readonly trigger: 'pop' | 'dup' | 'swap' | 'propagate';
    readonly index: number;
    readonly arg: Local;
    constructor(pch: number, id: number, trigger: Param['trigger'], index: number, arg: Local) {
        // super(pch, id, new SExpr(trigger, []));
        super(pch, id, arg === undefined ? new SExpr(trigger, []) : arg.expr);
        this.trigger = trigger;
        this.index = index;
        this.arg = arg;
        // if (arg !== undefined) {
        // arg.props['global'] = index + trigger + id;
        arg.global = `${pch}.${id}`;
        // }
    }

    override toString(): string {
        // return `$${expr.pch}.${expr.id}_${expr.trigger}${expr.index}` + (expr.props['jumpdest'] ? '*jd' : '') + (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
        return `$${this.pch}.${this.id}` + (this.jumpdest ? '*jd' : '');//+ (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
    }
}

export class Inst {
    readonly fn: string;
    readonly args: Local[];
    readonly pc: number;
    constructor(fn: string, args: Local[], pc: number) {
        this.fn = fn;
        this.args = args;
        this.pc = pc;
    }

    ret?: boolean;
}

export class Def extends Inst {
    readonly local: Local;
    constructor(local: Local, pc: number) {
        super('local', [], pc);
        this.local = local;
        local.pc = pc;
    }
}