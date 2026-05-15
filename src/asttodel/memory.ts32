import { Tag, type Expr, type IInst } from './index.ts';

export class MLoad extends Tag {
    readonly tag = 'MLoad';
    readonly location: Expr;
    readonly value?: Expr | undefined;
    constructor(location: Expr, value?: Expr) {
        super(Math.max(location.depth, value?.depth ?? 0) + 1, location.count + (value?.count ?? 0) + 1);
        this.location = location;
        this.value = value;
    }
    eval(): Expr {
        return this.value ? this.value.eval() : new MLoad(this.location.eval());
    }
}

export class MStore implements IInst {
    readonly name = 'MStore';
    readonly location: Expr;
    readonly data: Expr;
    constructor(location: Expr, data: Expr) {
        this.location = location;
        this.data = data;
    }
    eval() {
        return new MStore(this.location.eval(), this.data.eval());
    }
}
