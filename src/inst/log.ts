import { Opcode } from '../opcode';
import { Log, MLoad } from '../ast';
import { State } from '../state';
import { Contract } from '../contract';
import { isBigInt } from '../ast';

export const LOGS = (contract: Contract) => {
    return {
        LOG0: log(0, contract),
        LOG1: log(1, contract),
        LOG2: log(2, contract),
        LOG3: log(3, contract),
        LOG4: log(4, contract),
    };
};

function log(topicsCount: number, contract: Contract) {
    return (_opcode: Opcode, state: State): void => {
        const memoryStart = state.stack.pop();
        const memoryLength = state.stack.pop();
        const topics = [];

        for (let i = 0; i < topicsCount; i++) {
            topics.push(state.stack.pop());
        }

        if (topics.length > 0) {
            const eventTopic = topics[0].toString(16);
            if (!(eventTopic in contract.events)) {
                contract.events[eventTopic] = {
                    indexedCount: topics.length - 1,
                };
                if (eventTopic in contract.eventHashes) {
                    contract.events[eventTopic].label = contract.eventHashes[eventTopic];
                }
            }
        }

        if (isBigInt(memoryStart) && isBigInt(memoryLength)) {
            const args = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                args.push(i in state.memory ? state.memory[i] : new MLoad(BigInt(i)));
            }
            state.stmts.push(new Log(contract.eventHashes, topics, args));
        } else {
            state.stmts.push(new Log(contract.eventHashes, topics, [], memoryStart, memoryLength));
        }
    };
}
