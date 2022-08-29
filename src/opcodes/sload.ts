import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';
import { SHA3 } from '../inst/logic';

const parseMapping = (...items: Operand[]): Operand[] => {
    const mappings = [];
    for (const item of items) {
        if (item instanceof SHA3 && item.items) {
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
        readonly mappings: () => { [location: number]: EVM['mappings'][keyof EVM['mappings']] },
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

export default (_opcode: Opcode, state: EVM): void => {
    const storeLocation = state.stack.pop();
    if (typeof storeLocation !== 'bigint' && storeLocation.name === 'SHA3') {
        const mappingItems = parseMapping(...storeLocation.items!);
        const mappingLocation = <bigint | undefined>(
            mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
        );
        const mappingParts = mappingItems.filter(mappingItem => typeof mappingItem !== 'bigint');
        if (mappingLocation && mappingParts.length > 0) {
            const loc = Number(mappingLocation);
            if (!(loc in state.mappings)) {
                state.mappings[loc] = {
                    name: undefined,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[loc].keys.push(mappingParts);
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    loc,
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
        const mappingItems = parseMapping(...storeLocation.left.items!);
        const mappingLocation = <bigint | undefined>(
            mappingItems.find(mappingItem => typeof mappingItem === 'bigint')
        );
        const mappingParts = mappingItems.filter(mappingItem => typeof mappingItem !== 'bigint');
        if (mappingLocation && mappingParts.length > 0) {
            const loc = Number(mappingLocation);
            if (!(loc in state.mappings)) {
                state.mappings[loc] = {
                    name: undefined,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[loc].keys.push(mappingParts);
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    loc,
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
        const mappingItems = parseMapping(...storeLocation.right.items!);
        const mappingLocation = mappingItems.find(mappingItem => typeof mappingItem === 'bigint');
        const mappingParts = mappingItems.filter(mappingItem => typeof mappingItem !== 'bigint');
        if (mappingLocation && mappingParts.length > 0) {
            const loc = Number(mappingLocation);
            if (!(loc in state.mappings)) {
                state.mappings[loc] = {
                    name: undefined,
                    structs: [],
                    keys: [],
                    values: [],
                };
            }
            state.mappings[loc].keys.push(mappingParts);
            state.stack.push(
                new MappingLoad(
                    () => state.mappings,
                    loc,
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
