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
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const { Contract } = require('sevm');

/** @type {{[hash: string]: string}} */
// @ts-expect-error to avoid `Consider using '--resolveJsonModule' to import module with '.json' extension.`
const functionHashes = require('./functionHashes.min.json');

/** @type {{[hash: string]: string}} */
// @ts-expect-error to avoid `Consider using '--resolveJsonModule' to import module with '.json' extension.`
const eventHashes = require('./eventHashes.min.json');

Contract.prototype.patchdb = function () {
    for (const [topic, event] of Object.entries(this.events)) {
        if (topic in eventHashes) {
            event.sig = eventHashes[topic];
        }
    }

    for (const [selector, fn] of Object.entries(this.functions)) {
        if (selector in functionHashes) {
            fn.label = functionHashes[selector];
        }
    }

    return this;
};
