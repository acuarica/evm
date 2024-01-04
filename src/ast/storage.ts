import { type Expr, type IInst, Tag } from '.';

export interface IStore {
    /**
     * Variables definition
     */
    readonly variables: Map<bigint, Variable>;

    /**
     * mappings definition
     */
    readonly mappings: {
        [location: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    };
}

/**
 *
 */
export class Variable {
    constructor(
        public label: string | null,
        readonly types: Expr[],
        readonly index: number
    ) { }
}

export class MappingStore implements IInst {
    readonly name = 'MappingStore';

    constructor(
        readonly slot: Expr,
        readonly mappings: IStore['mappings'],
        readonly location: number,
        readonly items: Expr[],
        readonly data: Expr,
        readonly structlocation?: bigint
    ) {
        const loc = location;
        if (!(loc in mappings)) {
            mappings[loc] = { name: undefined, structs: [], keys: [], values: [] };
        }
        mappings[loc].keys.push(items);
        if (structlocation === undefined) {
            mappings[loc].values.push(data);
        }
    }

    eval() {
        return this;
    }
}

export class SStore {
    readonly name = 'SStore';

    constructor(
        readonly slot: Expr,
        readonly data: Expr,
        readonly variable: Variable | undefined,
    ) { }

    eval() {
        return new SStore(this.slot.eval(), this.data.eval(), this.variable);
    }
}

export class MappingLoad extends Tag {
    readonly tag = 'MappingLoad';
    constructor(
        readonly slot: Expr,
        readonly mappings: IStore['mappings'],
        readonly location: number,
        readonly items: Expr[],
        readonly structlocation?: bigint
    ) {
        super();
        if (!(location in mappings)) {
            mappings[location] = {
                name: undefined,
                structs: [],
                keys: [],
                values: [],
            };
        }
        mappings[location].keys.push(items);
    }

    eval() {
        return this;
    }
}

export class SLoad extends Tag {
    readonly tag = 'SLoad';
    constructor(readonly slot: Expr, readonly variable: Variable | undefined) {
        super();
    }
    eval(): Expr {
        return new SLoad(this.slot.eval(), this.variable);
    }
}
