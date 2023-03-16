import type { State } from '../state';
import { type Expr, type Stmt, Val, type IStmt } from './ast';
import { MLoad } from './memory';

/**
 *
 */
export interface IEVMEvents {
    /**
     * Events found through `LOG` instructions.
     *
     * The `topic` is represented as a hex string.
     */
    readonly events: {
        [topic: string]: {
            /**
             * The signature of the event when the `topic` selector is found.
             *
             * For instance, if the topic is
             * `4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426`,
             * then `sig` will be `Deposit(uint256)`.
             */
            sig?: string;
            indexedCount: number;
        };
    };
}

export class Log implements IStmt {
    readonly name = 'Log';

    constructor(
        readonly event: IEVMEvents['events'][string] | undefined,
        readonly topics: Expr[],
        readonly args: Expr[],
        readonly mem?: { offset: Expr; size: Expr }
    ) {}

    get eventName(): string | undefined {
        if (this.event !== undefined && this.event.sig !== undefined) {
            return this.event.sig.split('(')[0];
        }
        return undefined;
    }

    toString() {
        return this.eventName
            ? `emit ${this.eventName}(${[...this.topics.slice(1), ...this.args].join(', ')});`
            : 'log(' +
                  (this.mem
                      ? [...this.topics, `memory[${this.mem.offset}:${this.mem.size} ]`].join(
                            ', '
                        ) + 'ii'
                      : [...this.topics, ...this.args].join(', ')) +
                  ');';
    }
}

export const LOGS = (events: IEVMEvents) => {
    return {
        LOG0: log(0, events),
        LOG1: log(1, events),
        LOG2: log(2, events),
        LOG3: log(3, events),
        LOG4: log(4, events),
    };
};

function log(topicsCount: number, { events }: IEVMEvents) {
    return ({ stack, memory, stmts }: State<Stmt, Expr>): void => {
        let offset = stack.pop();
        let size = stack.pop();

        const topics = [];
        for (let i = 0; i < topicsCount; i++) {
            topics.push(stack.pop());
        }

        let event: IEVMEvents['events'][string] | undefined = undefined;
        if (topics.length > 0 && topics[0].isVal()) {
            const eventTopic = topics[0].val.toString(16);
            event = events[eventTopic];
            if (event === undefined) {
                event = { indexedCount: topics.length - 1 };
                events[eventTopic] = event;
            }
        }

        offset = offset.eval();
        size = size.eval();
        stmts.push(
            offset.isVal() && size.isVal()
                ? (() => {
                      const args = [];
                      for (let i = Number(offset.val); i < Number(offset.val + size.val); i += 32) {
                          args.push(i in memory ? memory[i] : new MLoad(new Val(BigInt(i))));
                      }
                      return new Log(event, topics, args);
                  })()
                : new Log(event, topics, [], { offset, size })
        );
    };
}
