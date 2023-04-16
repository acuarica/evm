import * as functionHashes from './functionHashes.min.json';
import * as eventHashes from './eventHashes.min.json';
import type { IEvents } from '../evm/log';
import { Contract } from '../';

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
