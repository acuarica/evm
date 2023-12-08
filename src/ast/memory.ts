import { Tag, type Expr, type IInst } from './expr';

export class MLoad extends Tag {
    readonly tag = 'MLoad';
    constructor(readonly loc: Expr) {
        super();
    }
    eval(): Expr {
        return new MLoad(this.loc.eval());
    }
}

export class MStore implements IInst {
    readonly name = 'MStore';
    constructor(readonly location: Expr, readonly data: Expr) {}
    eval() {
        return new MStore(this.location.eval(), this.data.eval());
    }
}
