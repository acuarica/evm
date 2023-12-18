import { type Expr, type IInst, Tag } from '.';

export interface IStore {
    /**
     * vars definition
     */
    readonly variables: { [location: string]: Variable };

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
    constructor(public label: string | undefined, readonly types: Expr[]) {}
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
        readonly location: Expr,
        readonly data: Expr,
        readonly variables: IStore['variables']
    ) {
        // if (isVal(this.location)) {
        //     const loc = this.location.toString();
        //     if (loc in this.variables) {
        //         this.variables[loc].types.push(this.data.type);
        //     } else {
        //         this.variables[loc] = new Variable(undefined, [this.data.type]);
        //     }
        // }
    }

    eval() {
        return new SStore(this.location.eval(), this.data.eval(), this.variables);
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
    constructor(readonly location: Expr, readonly variables: IStore['variables']) {
        super();
    }
    eval(): Expr {
        return new SLoad(this.location.eval(), this.variables);
    }
}
