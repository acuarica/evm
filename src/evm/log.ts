import type { Opcode } from '../opcode';
import type { State } from '../state';
import { type Expr, type Stmt, Val, type IStmt } from './ast';
import { MLoad } from './memory';

/**
 *
 */
export interface IEvents {
    get(topic: string): { label?: string; indexedCount: number } | undefined;

    // has(topic: string): boolean;

    set(topic: string, value: NonNullable<ReturnType<IEvents['get']>>): void;
}

export class Log implements IStmt {
    readonly name = 'Log';
    // readonly type?: string;
    // readonly wrapped = true;
    readonly eventName?: string;

    constructor(
        // private readonly eventHashes: { [s: string]: string },
        events: IEvents,
        readonly topics: Expr[],
        readonly args: Expr[],
        readonly memoryStart?: Expr,
        readonly memoryLength?: Expr
    ) {
        if (this.topics.length > 0 && this.topics[0].isVal()) {
            const event = events.get(this.topics[0].val.toString(16));
            if (event !== undefined && event.label !== undefined) {
                this.eventName = event.label.split('(')[0];
                this.topics.shift();
            }
        }
    }

    // eval(): Expr {
    //     return new Log(
    //         this.eventHashes,
    //         this.topics.map(evalExpr),
    //         this.args.map(evalExpr),
    //         this.memoryStart ? this.memoryStart.eval() : undefined,
    //         this.memoryLength ? this.memoryLength.eval() : undefined
    //     );
    // }

    toString() {
        return this.eventName
            ? `emit ${this.eventName}(${[...this.topics, ...this.args].join(', ')});`
            : 'log(' +
                  (this.memoryStart && this.memoryLength
                      ? [...this.topics, `memory[${this.memoryStart}:${this.memoryLength} ]`].join(
                            ', '
                        ) + 'ii'
                      : [...this.topics, ...this.args].join(', ')) +
                  ');';
    }
}

export const LOGS = (events: IEvents) => {
    return {
        LOG0: log(0, events),
        LOG1: log(1, events),
        LOG2: log(2, events),
        LOG3: log(3, events),
        LOG4: log(4, events),
    };
};

function log(topicsCount: number, events: IEvents) {
    return (_opcode: Opcode, state: State<Stmt, Expr>): void => {
        let offset = state.stack.pop();
        let size = state.stack.pop();
        const topics = [];

        for (let i = 0; i < topicsCount; i++) {
            topics.push(state.stack.pop());
        }

        if (topics.length > 0 && topics[0].isVal()) {
            const eventTopic = topics[0].val.toString(16);
            const event = events.get(eventTopic);
            if (event === undefined) {
                events.set(eventTopic, {
                    indexedCount: topics.length - 1,
                });
                // if (eventTopic in eventHashes) {
                //     events[eventTopic].label = eventHashes[eventTopic];
                // }
            }
        }

        offset = offset.eval();
        size = size.eval();
        if (offset.isVal() && size.isVal()) {
            const args = [];
            for (let i = Number(offset.val); i < Number(offset.val + size.val); i += 32) {
                args.push(i in state.memory ? state.memory[i] : new MLoad(new Val(BigInt(i))));
            }
            state.stmts.push(new Log(events, topics, args));
        } else {
            state.stmts.push(new Log(events, topics, [], offset, size));
        }
    };
}
