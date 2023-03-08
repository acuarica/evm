import type { Opcode } from '../opcode';
import { evalExpr, isBigInt, Log, MLoad } from '../ast';
import type { State } from '../state';
import type { Contract } from '../contract';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
        let offset = state.stack.pop();
        let size = state.stack.pop();
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

        offset = evalExpr(offset);
        size = evalExpr(size);
        if (isBigInt(offset) && isBigInt(size)) {
            const args = [];
            for (let i = Number(offset); i < Number(offset + size); i += 32) {
                args.push(i in state.memory ? state.memory[i] : new MLoad(BigInt(i)));
            }
            state.stmts.push(new Log(contract.eventHashes, topics, args));
        } else {
            state.stmts.push(new Log(contract.eventHashes, topics, [], offset, size));
        }
    };
}
