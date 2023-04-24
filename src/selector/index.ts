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
import type { IEvents } from '../evm/log';
import { Contract } from '..';

import * as functionHashes from './functionHashes.min.json';
import * as eventHashes from './eventHashes.min.json';

export function eventSelectors({ events }: IEvents) {
    for (const [topic, event] of Object.entries(events)) {
        if (topic in eventHashes) {
            event.sig = (eventHashes as { [key: string]: string })[topic];
        }
    }
}

function patch(contract: Contract): Contract {
    eventSelectors(contract.evm);

    for (const [selector, fn] of Object.entries(contract.functions)) {
        if (selector in functionHashes) {
            fn.label = (functionHashes as { [selector: string]: string })[selector];
        }
    }

    return contract;
}

declare module '../' {
    interface Contract {
        patch(): this;
    }
}

Contract.prototype.patch = function () {
    return patch(this);
};
