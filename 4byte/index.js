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
import { Contract } from 'sevm';

// @ts-ignore to avoid `has no default export` due to module's size
import functionHashes from './functionHashes.min.js';
import eventHashes from './eventHashes.min.js';

/**
 * @param {Contract} contract
 * @returns {Contract}
 */
export function patch(contract) {
    for (const [topic, event] of Object.entries(contract.evm.events)) {
        if (topic in eventHashes) {
            event.sig = eventHashes[topic];
        }
    }

    for (const [selector, fn] of Object.entries(contract.functions)) {
        if (selector in functionHashes) {
            fn.label = functionHashes[selector];
        }
    }

    return contract;
}

Contract.prototype.patch = function () {
    return patch(this);
};
