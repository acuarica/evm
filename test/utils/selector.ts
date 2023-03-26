import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

import type { IEvents } from '../../src/evm/log';
import { EventFragment, FunctionFragment, Interface } from 'ethers/lib/utils';
import type { Contract } from '../../src';

export function getFunctionSignature(selector: string): string {
    return (functionHashes as { [selector: string]: string })[selector];
}

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
    return contract;
}
