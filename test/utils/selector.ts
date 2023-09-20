import { EventFragment, FunctionFragment } from 'ethers';
import { Contract } from '../../src';

export function fnselector(sig: string): string {
    return FunctionFragment.from(sig).selector.substring(2);
}

export function eventSelector(sig: string): string {
    return EventFragment.from(sig).topicHash.substring(2);
}

declare module '../../src' {
    interface Contract {
        patchfns(...fns: string[]): this;
        patchevs(...fns: string[]): this;
    }
}

Contract.prototype.patchfns = function (...fns: string[]) {
    fns.forEach(fn => (this.functions[fnselector(fn)].label = fn));
    return this;
};

Contract.prototype.patchevs = function (...evs: string[]) {
    evs.forEach(ev => (this.evm.events[eventSelector(ev)].sig = ev));
    return this;
};
