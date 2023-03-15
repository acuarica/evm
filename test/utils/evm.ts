import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

import { EVM as EVM_ } from '../../src/evm';
import { decode as decode_, type Opcode } from '../../src/opcode';
import { stripMetadataHash } from '../../src/metadata';
import type { IEvents } from '../../src/evm/log';
import { FunctionFragment, Interface } from 'ethers/lib/utils';

export function decode(bytecode: string): Opcode[] {
    return decode_(Buffer.from(stripMetadataHash(bytecode)[0], 'hex'));
}

export function getFunctionSignature(selector: string): string {
    return (functionHashes as { [selector: string]: string })[selector];
}

export function getFunctionSelector(signature: string): string {
    return Interface.getSighash(FunctionFragment.from(signature)).substring(2);
}

export function EVM(bytecode: string) {
    return EVM_.from(
        bytecode,
        new (class implements IEvents {
            readonly events: { [topic: string]: { label?: string; indexedCount: number } } = {};

            get(topic: string): { label?: string; indexedCount: number } | undefined {
                return this.events[topic];
            }

            set(topic: string, value: { label?: string; indexedCount: number }): void {
                this.events[topic] = value;
                if (topic in eventHashes) {
                    // events[eventTopic].label = eventHashes[eventTopic];
                    value.label = (eventHashes as { [key: string]: string })[topic];
                }
            }
        })()
    );
}
