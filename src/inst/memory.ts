import { evalExpr, isBigInt } from '../ast';
import type { State } from '../state';
import { MLoad, MStore } from '../ast';

export const MEMORY = {
    MLOAD: ({ stack, memory }: State): void => {
        let memoryLocation = stack.pop();
        memoryLocation = evalExpr(memoryLocation);
        stack.push(
            isBigInt(memoryLocation) && Number(memoryLocation) in memory
                ? memory[Number(memoryLocation)]
                : new MLoad(memoryLocation)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
};

function mstore({ stack, memory, stmts }: State): void {
    let storeLocation = stack.pop();
    const storeData = stack.pop();
    storeLocation = evalExpr(storeLocation);
    if (isBigInt(storeLocation)) {
        memory[Number(storeLocation)] = storeData;
    } else {
        stmts.push(new MStore(storeLocation, storeData));
    }
}
