import { Opcode } from '../opcode';
import stringify from '../utils/stringify';
import { Operand, State } from '../state';
import { Variable } from './jumps';
import { Sha3 } from './sha3';
import { Contract } from '../contract';

export class MappingStore {
    readonly name = 'MappingStore';
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

export class SSTORE {
    readonly name = 'SSTORE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: Operand, readonly data: any, readonly variables: any) {
        if (typeof this.location === 'bigint' && this.location.toString() in this.variables()) {
            this.variables()[this.location.toString()].types.push(() => this.data.type);
        } else if (
            typeof this.location === 'bigint' &&
            !(this.location.toString() in this.variables())
        ) {
            this.variables()[this.location.toString()] = new Variable(undefined, [
                () => this.data.type,
            ]);
        }
    }

    toString() {
        let variableName = 'storage[' + stringify(this.location) + ']';
        if (typeof this.location === 'bigint' && this.location.toString() in this.variables()) {
            if (this.variables()[this.location.toString()].label) {
                variableName = this.variables()[this.location.toString()].label;
            } else {
                variableName =
                    'var' + (Object.keys(this.variables()).indexOf(this.location.toString()) + 1);
            }
        }
        if (
            this.data.name === 'ADD' &&
            this.data.right.name === 'SLOAD' &&
            stringify(this.data.right.location) === stringify(this.location)
        ) {
            return variableName + ' += ' + stringify(this.data.left) + ';';
        } else if (
            this.data.name === 'SUB' &&
            this.data.left.name === 'SLOAD' &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return variableName + ' -= ' + stringify(this.data.right) + ';';
        } else {
            return variableName + ' = ' + stringify(this.data) + ';';
        }
    }
}

const parseMapping = (...items: Operand[]): Operand[] => {
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
        readonly items: Operand[],
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

export class SLOAD {
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: any, readonly variables: any) {}

    toString() {
        if (typeof this.location === 'bigint' && this.location.toString() in this.variables()) {
            if (this.variables()[this.location.toString()].label) {
                return this.variables()[this.location.toString()].label;
            } else {
                return (
                    'var' + (Object.keys(this.variables()).indexOf(this.location.toString()) + 1)
                );
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
            if (typeof storeLocation !== 'bigint' && storeLocation.name === 'SHA3') {
                const mappingItems = parseMapping(...storeLocation.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
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
                    state.stack.push(new SLOAD(storeLocation, () => contract.variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation.name === 'ADD' &&
                storeLocation.left instanceof Sha3 &&
                typeof storeLocation.right === 'bigint'
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
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
                    state.stack.push(new SLOAD(storeLocation, () => contract.variables));
                }
            } else if (
                typeof storeLocation !== 'bigint' &&
                storeLocation.name === 'ADD' &&
                typeof storeLocation.left === 'bigint' &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items!);
                const mappingLocation = mappingItems.find(
                    mappingItem => typeof mappingItem === 'bigint'
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
                            storeLocation.left
                        )
                    );
                } else {
                    state.stack.push(new SLOAD(storeLocation, () => contract.variables));
                }
            } else {
                state.stack.push(new SLOAD(storeLocation, () => contract.variables));
            }
        },

        SSTORE: (_opcode: Opcode, state: State): void => {
            const storeLocation = state.stack.pop();
            const storeData = state.stack.pop();
            if (typeof storeLocation === 'bigint') {
                // throw new Error('bigint not expected in sstore');
                state.stmts.push(new SSTORE(storeLocation, storeData, () => contract.variables));
            } else if (storeLocation.name === 'SHA3') {
                const mappingItems = parseMapping(...storeLocation.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
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
                    state.stmts.push(
                        new SSTORE(storeLocation, storeData, () => contract.variables)
                    );
                }
            } else if (
                storeLocation.name === 'ADD' &&
                storeLocation.left instanceof Sha3 &&
                typeof storeLocation.right === 'bigint'
            ) {
                const mappingItems = parseMapping(...storeLocation.left.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
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
                    state.stmts.push(
                        new SSTORE(storeLocation, storeData, () => contract.variables)
                    );
                }
            } else if (
                storeLocation.name === 'ADD' &&
                typeof storeLocation.left === 'bigint' &&
                storeLocation.right instanceof Sha3
            ) {
                const mappingItems = parseMapping(...storeLocation.right.items!);
                const mappingLocation = <bigint | undefined>(
                    mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
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
                    state.stmts.push(
                        new SSTORE(storeLocation, storeData, () => contract.variables)
                    );
                }
            } else if (
                // eslint-disable-next-line no-constant-condition
                false &&
                // typeof storeLocation === 'bigint' &&
                storeLocation.toString() in contract.variables //&&
                // storeData.type &&
                // (!)state.variables[storeLocation.toString()].types.includes(storeData.type)
            ) {
                state.stmts.push(new SSTORE(storeLocation, storeData, () => contract.variables));
                // state.variables[storeLocation.toString()].types.push(storeData.type);
            } else {
                state.stmts.push(new SSTORE(storeLocation, storeData, () => contract.variables));
            }
        },
    };
};
