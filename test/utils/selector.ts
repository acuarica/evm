import { EventFragment, FunctionFragment } from 'ethers';

export function fnselector(sig: string): string {
    return FunctionFragment.from(sig).selector.substring(2);
}

export function eventSelector(sig: string): string {
    return EventFragment.from(sig).topicHash.substring(2);
}
