import { Opcode } from '../opcode';
import { Expr, isBigInt, stringify } from './utils';
import { State } from '../state';
import { Sha3 } from './sha3';
import { Contract, Variable } from '../contract';
import { Add, Sub } from './math';

export class MappingStore {
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: any,
        readonly location: any,
        readonly items: any,
        readonly data: any,
        readonly count: any,
        readonly structlocation?: any
    ) {}

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        if (this.location in this.mappings() && this.mappings()[this.location].name) {
            mappingName = this.mappings()[this.location].name;
        }
        if (
            this.data.name === 'ADD' &&
            this.data.right.name === 'MappingLoad' &&
            stringify(this.data.right.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' += ' +
                stringify(this.data.left) +
                ';'
            );
        } else if (
            this.data.name === 'ADD' &&
            this.data.left.name === 'MappingLoad' &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' += ' +
                stringify(this.data.right) +
                ';'
            );
        } else if (
            this.data.name === 'SUB' &&
            this.data.left.name === 'MappingLoad' &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' -= ' +
                stringify(this.data.right) +
                ';'
            );
        } else {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' = ' +
                stringify(this.data) +
                ';'
            );
        }
    }
}

export class SStore {
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly location: Expr,
        readonly data: Expr,
        readonly variables: Contract['variables']
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

    toString() {
        let variableName = 'storage[' + stringify(this.location) + ']';
        const loc = this.location.toString();
        if (isBigInt(this.location) && loc in this.variables) {
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
            stringify(this.data.right.location) === stringify(this.location)
        ) {
            return variableName + ' += ' + stringify(this.data.left) + ';';
        } else if (
            this.data instanceof Sub &&
            this.data.left instanceof SLoad &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return variableName + ' -= ' + stringify(this.data.right) + ';';
        } else {
            return variableName + ' = ' + stringify(this.data) + ';';
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

export class MappingLoad {
    readonly name = 'MappingLoad';
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: () => {
            [location: number]: Contract['mappings'][keyof Contract['mappings']];
        },
        readonly location: number,
        readonly items: Expr[],
        readonly count: number,
        readonly structlocation?: bigint
    ) {}

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        const maybeName = this.mappings()[this.location].name;
        if (this.location in this.mappings() && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => '[' + stringify(item) + ']').join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return mappingName + this.items.map(item => '[' + stringify(item) + ']').join('');
        }
    }
}

export class SLoad {
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: Expr, readonly variables: Contract['variables']) {}

    toString() {
        if (isBigInt(this.location) && this.location.toString() in this.variables) {
            const label = this.variables[this.location.toString()].label;
            if (label) {
                return label;
            } else {
                return 'var' + (Object.keys(this.variables).indexOf(this.location.toString()) + 1);
            }
        } else {
            return 'storage[' + stringify(this.location) + ']';
        }
    }
}

export const STORAGE = (contract: Contract) => {
    return {
        SLOAD: (_opcode: Opcode, state: State): void => {
            const storeLocation = state.stack.pop();
            if (storeLocation instanceof Sha3) {
                const mappingItems = parseMapping(...storeLocation.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => isBigInt(mappingItem))
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => contract.mappings,
                            loc,
                            mappingParts,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString())
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, contract.variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation instanceof Add &&
                storeLocation.left instanceof Sha3 &&
                isBigInt(storeLocation.right)
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => isBigInt(mappingItem))
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => contract.mappings,
                            loc,
                            mappingParts,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString()),
                            storeLocation.right
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, contract.variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation instanceof Add &&
                isBigInt(storeLocation.left) &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items!);
                const mappingLocation = mappingItems.find(mappingItem => isBigInt(mappingItem));
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    state.stack.push(
                        new MappingLoad(
                            () => contract.mappings,
                            loc,
                            mappingParts,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString()),
                            storeLocation.left
                        )
                    );
                } else {
                    state.stack.push(new SLoad(storeLocation, contract.variables));
                }
            } else {
                state.stack.push(new SLoad(storeLocation, contract.variables));
            }
        },

        SSTORE: (_opcode: Opcode, state: State): void => {
            const storeLocation = state.stack.pop();
            const storeData = state.stack.pop();
            if (isBigInt(storeLocation)) {
                // throw new Error('bigint not expected in sstore');
                sstoreVariable();
                // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
            } else if (storeLocation instanceof Sha3) {
                const mappingItems = parseMapping(...storeLocation.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => isBigInt(mappingItem))
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    contract.mappings[loc].values.push(storeData);
                    state.stmts.push(
                        new MappingStore(
                            () => contract.mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString())
                        )
                    );
                } else {
                    sstoreVariable();
                    // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                }
            } else if (
                storeLocation instanceof Add &&
                storeLocation.left instanceof Sha3 &&
                isBigInt(storeLocation.right)
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => isBigInt(mappingItem))
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    state.stmts.push(
                        new MappingStore(
                            () => contract.mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString()),
                            storeLocation.right
                        )
                    );
                } else {
                    sstoreVariable();
                    // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                }
            } else if (
                storeLocation instanceof Add &&
                isBigInt(storeLocation.left) &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => isBigInt(mappingItem))
                );
                const mappingParts = mappingItems.filter(
                    mappingItem => typeof mappingItem !== 'bigint'
                );
                if (mappingLocation && mappingParts.length > 0) {
                    const loc = Number(mappingLocation);
                    if (!(loc in contract.mappings)) {
                        contract.mappings[loc] = {
                            name: undefined,
                            structs: [],
                            keys: [],
                            values: [],
                        };
                    }
                    contract.mappings[loc].keys.push(mappingParts);
                    state.stmts.push(
                        new MappingStore(
                            () => contract.mappings,
                            mappingLocation,
                            mappingParts,
                            storeData,
                            Object.keys(contract.mappings).indexOf(mappingLocation.toString()),
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
                storeLocation.toString() in contract.variables //&&
                // storeData.type &&
                // (!)state.variables[storeLocation.toString()].types.includes(storeData.type)
            ) {
                state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
                // state.variables[storeLocation.toString()].types.push(storeData.type);
            } else {
                sstoreVariable();
                // state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
            }

            function sstoreVariable() {
                if (isBigInt(storeLocation)) {
                    const loc = storeLocation.toString();
                    if (loc in contract.variables) {
                        contract.variables[loc].types.push((storeData as any).type);
                    } else {
                        contract.variables[loc] = new Variable(undefined, [
                            (storeData as any).type,
                        ]);
                    }
                }
                state.stmts.push(new SStore(storeLocation, storeData, contract.variables));
            }
        },
    };
};
