import { Opcode } from '../opcode';
import { Expr, isBigInt, isVal, MappingLoad, MappingStore, SLoad, SStore } from '../ast';
import { State } from '../state';
import { Sha3 } from '../ast';
import { Contract, Variable } from '../contract';
import { Add } from '../ast';

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
                if (isVal(storeLocation)) {
                    const loc = storeLocation.eval().toString();
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
