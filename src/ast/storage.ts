import { type Expr, type IInst, Tag } from './expr';

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

export class MappingLoad extends Tag('MappingLoad') {
    constructor(
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

    str(): string {
        let mappingName = `mapping${this.location + 1}`;
        const maybeName = this.mappings[this.location].name;
        if (this.location in this.mappings && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => `[${item.str()}]`).join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return mappingName + this.items.map(item => '[' + item.str() + ']').join('');
        }
    }
}

export class SLoad extends Tag('SLoad') {
    constructor(readonly location: Expr, readonly variables: IStore['variables']) {
        super();
    }

    eval(): Expr {
        return new SLoad(this.location.eval(), this.variables);
    }

    str(): string {
        if (this.location.isVal() && this.location.val.toString() in this.variables) {
            const loc = this.location.val.toString();
            const label = this.variables[loc].label;
            if (label) {
                return label;
            } else {
                return `var${Object.keys(this.variables).indexOf(loc) + 1}`;
            }
        } else {
            return 'storage[' + this.location.str() + ']';
        }
    }
}
