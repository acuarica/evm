import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { MLOAD } from './memory';
import { Operand, State } from '../state';

export class Log {
    readonly name = 'LOG';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items?: any;
    readonly eventName?: string;

    constructor(
        eventHashes: { [s: string]: string },
        readonly topics: Operand[],
        args?: Operand[],
        memoryStart?: Operand,
        memoryLength?: Operand
    ) {
        if (
            this.topics.length > 0 &&
            typeof this.topics[0] === 'bigint' &&
            this.topics[0].toString(16) in eventHashes
        ) {
            this.eventName = eventHashes[this.topics[0].toString(16)].split('(')[0];
            this.topics.shift();
        }
        if (this.memoryStart && this.memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = args;
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

export const LOGS = (evm: EVM) => {
    return {
        LOG0: log(0, evm),
        LOG1: log(1, evm),
        LOG2: log(2, evm),
        LOG3: log(3, evm),
        LOG4: log(4, evm),
    };
};

function log(topicsCount: number, evm: EVM) {
    return (_opcode: Opcode, state: State): void => {
        const memoryStart = state.stack.pop();
        const memoryLength = state.stack.pop();
        const topics = [];
        for (let i = 0; i < topicsCount; i++) {
            topics.push(state.stack.pop());
        }
        if (topics.length > 0) {
            const eventTopic = topics[0].toString(16);
            if (!(eventTopic in evm.events)) {
                evm.events[eventTopic] = {
                    indexedCount: topics.length - 1,
                };
                if (eventTopic in evm.eventHashes) {
                    evm.events[eventTopic].label = evm.eventHashes[eventTopic];
                }
            }
        }

        if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint') {
            const args = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                args.push(i in state.memory ? state.memory[i] : new MLOAD(i));
            }

            // aparently not used
            // if (topics.length === 0) {
            // if (!('anonymous' in state.events)) {
            // state.events['anonymous'] = [];
            // }
            // state.events['anonymous'].push({ items });
            // }

            state.stmts.push(new Log(evm.eventHashes, topics, args));
        } else {
            state.stmts.push(new Log(evm.eventHashes, topics, [], memoryStart, memoryLength));
        }
    };
}
