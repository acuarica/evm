import { Tag, type Expr, type IInst } from '.';

export class MLoad extends Tag {
    readonly tag = 'MLoad';
    constructor(readonly location: Expr, readonly value?: Expr) {
        super();
    }
    eval(): Expr {
        return this.value ? this.value.eval() : new MLoad(this.location.eval());
    }
}

export class MStore implements IInst {
    readonly name = 'MStore';
    constructor(readonly location: Expr, readonly data: Expr) { }
    eval() {
        return new MStore(this.location.eval(), this.data.eval());
    }
}
