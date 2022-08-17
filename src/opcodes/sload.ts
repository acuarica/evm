import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';
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

export class MappingLoad {
    readonly name = 'MappingLoad';
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: any,
        readonly location: any,
        readonly items: any,
        readonly count: any,
        readonly structlocation?: any
    ) {}

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        if (this.location in this.mappings() && this.mappings()[this.location].name) {
            mappingName = this.mappings()[this.location].name;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return (
                mappingName + this.items.map((item: any) => '[' + stringify(item) + ']').join('')
            );
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

export default (_opcode: Opcode, state: EVM): void => {
    const storeLocation = state.stack.pop();
    if (typeof storeLocation !== 'bigint' && storeLocation.name === 'SHA3') {
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
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString())
                )
            );
        } else {
            state.stack.push(new SLOAD(storeLocation, () => state.variables));
        }
    } else if (
        typeof storeLocation !== 'bigint' &&
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
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString()),
                    storeLocation.right
                )
            );
        } else {
            state.stack.push(new SLOAD(storeLocation, () => state.variables));
        }
    } else if (
        typeof storeLocation !== 'bigint' &&
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
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    mappingLocation,
                    mappingParts,
                    Object.keys(state.mappings).indexOf(mappingLocation.toString()),
                    storeLocation.left
                )
            );
        } else {
            state.stack.push(new SLOAD(storeLocation, () => state.variables));
        }
    } else {
        state.stack.push(new SLOAD(storeLocation, () => state.variables));
    }
};
