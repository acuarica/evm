import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

import type { IEvents } from '../../src/evm/log';
import { EventFragment, FunctionFragment, Interface } from 'ethers/lib/utils';
import { Contract } from '../../src';

export function fnselector(sig: string): string {
    return Interface.getSighash(FunctionFragment.from(sig)).substring(2);
}

export function eventSelector(sig: string): string {
    return Interface.getEventTopic(EventFragment.from(sig)).substring(2);
}

export function eventSelectors({ events }: IEvents) {
    for (const [topic, event] of Object.entries(events)) {
        if (topic in eventHashes) {
            event.sig = (eventHashes as { [key: string]: string })[topic];
        }
    }
}

export function patch(contract: Contract): Contract {
    eventSelectors(contract.evm);

    for (const [selector, fn] of Object.entries(contract.functions)) {
        if (selector in functionHashes) {
            fn.label = (functionHashes as { [selector: string]: string })[selector];
        }
    }

    return contract;
}

declare module '../../src' {
    interface Contract {
        patch(): this;
    }
}

Contract.prototype.patch = function () {
    return patch(this);
};
