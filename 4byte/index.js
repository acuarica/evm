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
/* eslint-env node */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */

const { Contract } = require('sevm');

/**@type {{[hash: string]: string}} */
// @ts-ignore to avoid `Consider using '--resolveJsonModule' to import module with '.json' extension.`
const functionHashes = require('./functionHashes.min.json');

/**@type {{[hash: string]: string}} */
// @ts-ignore to avoid `Consider using '--resolveJsonModule' to import module with '.json' extension.`
const eventHashes = require('./eventHashes.min.json');

/**
 * @param {Contract} contract
 * @returns {Contract}
 */
function patch(contract) {
    for (const [topic, event] of Object.entries(contract.events)) {
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
