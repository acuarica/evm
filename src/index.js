/**
 * This module provides a fair database of selectors for both functions and events.
 *
 * Given the size of the database,
 * this module is completely decoupled from the rest of the package.
 * This allows the user to provide their own set of selectors.
 *
 * This module does not `export` any functions nor classes.
 * Instead, it appends the `patch` method to the `Contract` class.
 *
 * @packageDocumentation
 */
// import type { IEvents } from '../evm/log';
import { Contract } from 'sevm';

export * from 'sevm';

import functionHashes from './functionHashes.min.js';
import eventHashes from './eventHashes.min.js';

/**
 * 
 * @param {IEvents} param0 
 */
export function eventSelectors({ events }) {
    for (const [topic, event] of Object.entries(events)) {
        if (topic in eventHashes) {
            // event.sig = (eventHashes as { [key: string]: string })[topic];
            event.sig = (eventHashes)[topic];
        }
    }
}

/**
 * 
 * @param {Contract} contract 
 * @returns {Contract}
 */
function patch(contract) {
    eventSelectors(contract.evm);

    for (const [selector, fn] of Object.entries(contract.functions)) {
        if (selector in functionHashes) {
            // fn.label = (functionHashes as { [selector: string]: string })[selector];
            fn.label = (functionHashes)[selector];
        }
    }

    return contract;
}

// declare module '../' {
//     interface Contract {
//         patch(): this;
//     }
// }

Contract.prototype.patch = function () {
    return patch(this);
};
