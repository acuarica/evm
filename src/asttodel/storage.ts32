import { type Expr, type IInst, Tag } from './index.ts';

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
    public label: string | null;
    readonly types: Expr[];
    readonly index: number;
    constructor(
        label: string | null,
        types: Expr[],
        index: number
    ) {
        this.label = label;
        this.types = types;
        this.index = index;
    }
}

export class MappingStore implements IInst {
    readonly name = 'MappingStore';
    readonly slot: Expr;
    readonly mappings: IStore['mappings'];
    readonly location: number;
    readonly items: Expr[];
    readonly data: Expr;
    readonly structlocation?: bigint | undefined;

    constructor(
        slot: Expr,
        mappings: IStore['mappings'],
        location: number,
        items: Expr[],
        data: Expr,
        structlocation?: bigint
    ) {
        this.slot = slot;
        this.mappings = mappings;
        this.location = location;
        this.items = items;
        this.data = data;
        this.structlocation = structlocation;
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
        return new MappingStore(this.slot, this.mappings, this.location, this.items, this.data.eval(), this.structlocation);
    }
}

export class SStore {
    readonly name = 'SStore';

    readonly slot: Expr;
    readonly data: Expr;
    readonly variable: Variable | undefined;
    constructor(
        slot: Expr,
        data: Expr,
        variable: Variable | undefined,
    ) {
        this.slot = slot;
        this.data = data;
        this.variable = variable;
    }

    eval() {
        const data = this.data.eval();
        if (this.variable !== undefined) {
            const i = this.variable.types.indexOf(this.data);
            if (i === -1) throw new Error('error in eval sstore');
            this.variable.types[i] = data;
        }
        return new SStore(this.slot.eval(), data, this.variable);
    }
}

export class MappingLoad extends Tag {
    readonly tag = 'MappingLoad';
    readonly slot: Expr;
    readonly mappings: IStore['mappings'];
    readonly location: number;
    readonly items: Expr[];
    readonly structlocation?: bigint | undefined;

    constructor(
        slot: Expr,
        mappings: IStore['mappings'],
        location: number,
        items: Expr[],
        structlocation?: bigint,
    ) {
        super(
            Math.max(slot.depth, ...items.map(e => e.depth)) + 1,
            slot.count + items.reduce((accum, curr) => accum + curr.count, 0) + 1
        );

        this.slot = slot;
        this.mappings = mappings;
        this.location = location;
        this.items = items;
        this.structlocation = structlocation;

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
    readonly slot: Expr;
    readonly variable: Variable | undefined;

    constructor(slot: Expr, variable: Variable | undefined) {
        super(slot.depth + 1, slot.count + 1);
        this.slot = slot;
        this.variable = variable;
    }
    eval(): Expr {
        return new SLoad(this.slot.eval(), this.variable);
    }
}
