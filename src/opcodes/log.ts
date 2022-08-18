import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { MLOAD } from './mload';

export class LOG {
    readonly name = 'LOG';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items?: any;
    readonly eventName?: string;

    constructor(
        eventHashes: { [s: string]: string },
        readonly topics: any,
        items?: any,
        memoryStart?: any,
        memoryLength?: any
    ) {
        if (
            this.topics.length > 0 &&
            typeof this.topics[0] === 'bigint' &&
            this.topics[0].toString(16) in eventHashes
        ) {
            this.eventName = (eventHashes as any)[this.topics[0].toString(16)].split('(')[0];
            this.topics.shift();
        }
        if (this.memoryStart && this.memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.eventName) {
            return (
                'emit ' + this.eventName + '(' + [...this.topics, ...this.items].join(', ') + ');'
            );
        } else {
            return 'log(' + [...this.topics, ...this.items].join(', ') + ');';
        }
    }
}

export default (topicsCount: number) => {
    return (_opcode: Opcode, state: EVM): void => {
        const memoryStart = state.stack.pop();
        const memoryLength = state.stack.pop();
        const topics = [];
        for (let i = 0; i < topicsCount; i++) {
            topics.push(state.stack.pop());
        }
        if (topics.length > 0) {
            const eventTopic = topics[0].toString(16);
            if (!(eventTopic in state.events)) {
                state.events[eventTopic] = {};
                state.events[eventTopic].indexedCount = topics.length - 1;
                if (eventTopic in state.eventHashes) {
                    state.events[eventTopic].label = state.eventHashes[eventTopic];
                }
            }
        }
        if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint') {
            const items = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                if (i in state.memory) {
                    items.push(state.memory[i]);
                } else {
                    items.push(new MLOAD(i));
                }
            }
            if (topics.length === 0) {
                if (!('anonymous' in state.events)) {
                    state.events['anonymous'] = [];
                }
                state.events['anonymous'].push({ items });
            }
            state.instructions.push(new LOG(state.eventHashes, topics, items));
        } else {
            state.instructions.push(
                new LOG(state.eventHashes, topics, [], memoryStart, memoryLength)
            );
        }
    };
};
