import type { State } from '../state';
import { type Expr, type IStmt, type Stmt, Tag } from './ast';
import { Sha3 } from './system';
import { Add, Sub } from './math';

export interface IEVMStore {
    /**
     * vars definition
     */
    readonly variables: { [key: string]: Variable };

    /**
     * mappings definition
     */
    readonly mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    };
}

export class Variable {
    constructor(public label: string | undefined, readonly types: Expr[]) {}
}
export class MappingStore implements IStmt {
    readonly name = 'MappingStore';

    constructor(
        readonly mappings: any,
        readonly location: any,
        readonly items: any,
        readonly data: any,
        readonly count: any,
        readonly structlocation?: any
    ) {}

    eval() {
        return this;
    }

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        if (this.location in this.mappings() && this.mappings()[this.location].name) {
            mappingName = this.mappings()[this.location].name;
        }
        if (
            this.data.name === 'ADD' &&
            this.data.right.name === 'MappingLoad' &&
            this.data.right.location.str() === this.location.str()
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + item.str() + ']').join('') +
                ' += ' +
                this.data.left.str() +
                ';'
            );
        } else if (
            this.data.name === 'ADD' &&
            this.data.left.name === 'MappingLoad' &&
            this.data.left.location.str() === this.location.str()
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + item.str() + ']').join('') +
                ' += ' +
                this.data.right.str() +
                ';'
            );
        } else if (
            this.data.name === 'SUB' &&
            this.data.left.name === 'MappingLoad' &&
            this.data.left.location.str() === this.location.str()
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + item.str() + ']').join('') +
                ' -= ' +
                this.data.right.str() +
                ';'
            );
        } else {
            return (
                mappingName +
                this.items.map((item: any) => '[' + item.str() + ']').join('') +
                ' = ' +
                this.data.str() +
                ';'
            );
        }
    }
}

export class SStore {
    readonly name = 'SStore';

    constructor(
        readonly location: Expr,
        readonly data: Expr,
        readonly variables: IEVMStore['variables']
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

    toString() {
        let variableName = 'storage[' + this.location.str() + ']';
        const loc = this.location.toString();
        if (this.location.isVal() && loc in this.variables) {
            const label = this.variables[loc].label;
            if (label) {
                variableName = label;
            } else {
                variableName = 'var' + (Object.keys(this.variables).indexOf(loc) + 1);
            }
        }
        if (
            this.data instanceof Add &&
            this.data.right instanceof SLoad &&
            this.data.right.location.str() === this.location.str()
        ) {
            return variableName + ' += ' + this.data.left.str() + ';';
        } else if (
            this.data instanceof Sub &&
            this.data.left instanceof SLoad &&
            this.data.left.location.str() === this.location.str()
        ) {
            return variableName + ' -= ' + this.data.right.str() + ';';
        } else {
            return variableName + ' = ' + this.data.str() + ';';
        }
    }
}

export class MappingLoad extends Tag('MappingLoad') {
    readonly name = 'MappingLoad';
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: () => {
            [location: number]: IEVMStore['mappings'][keyof IEVMStore['mappings']];
        },
        readonly location: number,
        readonly items: Expr[],
        readonly count: number,
        readonly structlocation?: bigint
    ) {
        super();
    }

    eval() {
        return this;
    }
    str(): string {
        let mappingName = 'mapping' + (this.count + 1);
        const maybeName = this.mappings()[this.location].name;
        if (this.location in this.mappings() && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => '[' + item.str() + ']').join('') +
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
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: Expr, readonly variables: IEVMStore['variables']) {
        super();
    }

    eval(): Expr {
        return new SLoad(this.location.eval(), this.variables);
    }

    str(): string {
        if (this.location.isVal() && this.location.toString() in this.variables) {
            const label = this.variables[this.location.toString()].label;
            if (label) {
                return label;
            } else {
                return 'var' + (Object.keys(this.variables).indexOf(this.location.toString()) + 1);
            }
        } else {
            return 'storage[' + this.location.str() + ']';
        }
    }
}
const parseMapping = (...items: Expr[]): Expr[] => {
    const mappings = [];
    for (const item of items) {
        if (item instanceof Sha3 && item.items) {
            mappings.push(...parseMapping(...item.items));
        } else {
            mappings.push(item);
        }
    }
    return mappings;
};

export const STORAGE = ({ variables, mappings }: IEVMStore) => {
    return {
        SLOAD: (state: State<Stmt, Expr>): void => {
            const storeLocation = state.stack.pop();
            if (storeLocation instanceof Sha3) {
                const mappingItems = parseMapping(...storeLocation.items);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => mappingItem.isVal())
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => mappings,
                            loc,
                            mappingParts,
                            Object.keys(mappings).indexOf(mappingLocation.toString())
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation instanceof Add &&
                storeLocation.left instanceof Sha3 &&
                storeLocation.right.isVal()
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => mappingItem.isVal())
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => mappings,
                            loc,
                            mappingParts,
                            Object.keys(mappings).indexOf(mappingLocation.toString()),
                            storeLocation.right.val
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation instanceof Add &&
                storeLocation.left.isVal() &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items);
                const mappingLocation = mappingItems.find(mappingItem => mappingItem.isVal());
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => mappings,
                            loc,
                            mappingParts,
                            Object.keys(mappings).indexOf(mappingLocation.toString()),
                            storeLocation.left.val
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, variables));
                }
            } else {
                state.stack.push(new SLoad(storeLocation, variables));
            }
        },

        SSTORE: (state: State<Stmt, Expr>): void => {
            const storeLocation = state.stack.pop();
            const storeData = state.stack.pop();
            if (storeLocation.isVal()) {
                // throw new Error('bigint not expected in sstore');
                sstoreVariable();
                // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
            } else if (storeLocation instanceof Sha3) {
                const mappingItems = parseMapping(...storeLocation.items);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => mappingItem.isVal())
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    mappings[loc].values.push(storeData);
                    state.stmts.push(
                        new MappingStore(
                            () => mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(mappings).indexOf(mappingLocation.toString())
                        )
                    );
                } else {
                    sstoreVariable();
                    // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                }
            } else if (
                storeLocation instanceof Add &&
                storeLocation.left instanceof Sha3 &&
                storeLocation.right.isVal()
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => mappingItem.isVal())
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    state.stmts.push(
                        new MappingStore(
                            () => mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(mappings).indexOf(mappingLocation.toString()),
                            storeLocation.right.val
                        )
                    );
                } else {
                    sstoreVariable();
                    // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                }
            } else if (
                storeLocation instanceof Add &&
                storeLocation.left.isVal() &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => mappingItem.isVal())
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in mappings)) {
                        mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    mappings[loc].keys.push(mappingParts);
                    state.stmts.push(
                        new MappingStore(
                            () => mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(mappings).indexOf(mappingLocation.toString()),
                            storeLocation.left
                        )
                    );
                } else {
                    sstoreVariable();
                    // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                }
            } else if (
                // eslint-disable-next-line no-constant-condition
                false &&
                // isVal(storeLocation) &&
                storeLocation.toString() in variables //&&
                // storeData.type &&
                // (!)state.variables[storeLocation.toString()].types.includes(storeData.type)
            ) {
                state.stmts.push(new SStore(storeLocation, storeData, variables));
                // state.variables[storeLocation.toString()].types.push(storeData.type);
            } else {
                sstoreVariable();
                // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
            }

            function sstoreVariable() {
                if (storeLocation.isVal()) {
                    const loc = storeLocation.eval().toString();
                    if (loc in variables) {
                        variables[loc].types.push(storeData);
                    } else {
                        variables[loc] = new Variable(undefined, [storeData]);
                    }
                }
                state.stmts.push(new SStore(storeLocation, storeData, variables));
            }
        },
    };
};
