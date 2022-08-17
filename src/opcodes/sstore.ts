import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';
import { Variable } from './jumpi';
import { SHA3 } from './sha3';

const parseMapping = (...items: any[]) => {
    const mappings: any = [];
    items.forEach((item2: any) => {
        if (item2.name === 'SHA3' && item2.items) {
            mappings.push(...parseMapping(...item2.items));
        } else {
            mappings.push(item2);
        }
    });
    return mappings;
};

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

    constructor(readonly location: any, readonly data: any, readonly variables: any) {
        if (typeof this.location === 'bigint' && this.location.toString() in this.variables()) {
            this.variables()[this.location.toString()].types.push(() => this.data.type);
        } else if (
            typeof this.location === 'bigint' &&
            !(this.location.toString() in this.variables())
        ) {
            this.variables()[this.location.toString()] = new Variable(false, [
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

export default (_opcode: Opcode, state: EVM): void => {
    const storeLocation = state.stack.pop();
    const storeData = state.stack.pop();
    if (typeof storeLocation === 'bigint') {
        // throw new Error('bigint not expected in sstore');
        state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
    } else if (storeLocation.name === 'SHA3') {
        const mappingItems = parseMapping(...storeLocation.items);
        const mappingLocation = mappingItems.find(
            (mappingItem: any) => typeof mappingItem === 'bigint'
        );
        const mappingParts = mappingItems.filter(
            (mappingItem: any) => typeof mappingItem !== 'bigint'
        );
        if (mappingLocation && mappingParts.length > 0) {
            if (!(mappingLocation in state.mappings)) {
                state.mappings[mappingLocation] = {
                    name: false,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[mappingLocation].keys.push(mappingParts);
            state.mappings[mappingLocation].values.push(storeData);
            state.instructions.push(
                new MappingStore(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    storeData,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString())
                )
            );
        } else {
            state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
        }
    } else if (
        storeLocation.name === 'ADD' &&
        storeLocation.left instanceof SHA3 &&
        typeof storeLocation.right === 'bigint'
    ) {
        const mappingItems = parseMapping(...storeLocation.left.items);
        const mappingLocation = mappingItems.find(
            (mappingItem: any) => typeof mappingItem === 'bigint'
        );
        const mappingParts = mappingItems.filter(
            (mappingItem: any) => typeof mappingItem !== 'bigint'
        );
        if (mappingLocation && mappingParts.length > 0) {
            if (!(mappingLocation in state.mappings)) {
                state.mappings[mappingLocation] = {
                    name: false,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[mappingLocation].keys.push(mappingParts);
            state.instructions.push(
                new MappingStore(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    storeData,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString()),
                    storeLocation.right
                )
            );
        } else {
            state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
        }
    } else if (
        storeLocation.name === 'ADD' &&
        typeof storeLocation.left === 'bigint' &&
        storeLocation.right instanceof SHA3
    ) {
        const mappingItems = parseMapping(...storeLocation.right.items);
        const mappingLocation = mappingItems.find(
            (mappingItem: any) => typeof mappingItem === 'bigint'
        );
        const mappingParts = mappingItems.filter(
            (mappingItem: any) => typeof mappingItem !== 'bigint'
        );
        if (mappingLocation && mappingParts.length > 0) {
            if (!(mappingLocation in state.mappings)) {
                state.mappings[mappingLocation] = {
                    name: false,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[mappingLocation].keys.push(mappingParts);
            state.instructions.push(
                new MappingStore(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    storeData,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString()),
                    storeLocation.left
                )
            );
        } else {
            state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
        }
    } else if (
        // eslint-disable-next-line no-constant-condition
        false &&
        // typeof storeLocation === 'bigint' &&
        storeLocation.toString() in state.variables //&&
        // storeData.type &&
        // (!)state.variables[storeLocation.toString()].types.includes(storeData.type)
    ) {
        state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
        // state.variables[storeLocation.toString()].types.push(storeData.type);
    } else {
        state.instructions.push(new SSTORE(storeLocation, storeData, () => state.variables));
    }
};
