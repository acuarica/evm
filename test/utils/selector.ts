import { EventFragment, FunctionFragment, Interface } from 'ethers/lib/utils';

export function fnselector(sig: string): string {
    return Interface.getSighash(FunctionFragment.from(sig)).substring(2);
}

export function eventSelector(sig: string): string {
    return Interface.getEventTopic(EventFragment.from(sig)).substring(2);
}
