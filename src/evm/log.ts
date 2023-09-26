import { type Expr, type IInst } from './expr';

/**
 *
 */
export interface IEvents {
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

/**
 *
 * @param events
 * @returns
 */
export function stringifyEvents(events: IEvents['events']) {
    let text = '';

    for (const [topic, event] of Object.entries(events)) {
        text += 'event ';
        if (event.sig === undefined) {
            text += topic;
        } else {
            const eventName = event.sig.split('(')[0];
            const params = event.sig.replace(eventName, '').substring(1).slice(0, -1);
            if (params) {
                text += eventName + '(';
                text += params
                    .split(',')
                    .map((param, i) =>
                        i < event.indexedCount ? `${param} indexed _arg${i}` : `${param} _arg${i}`
                    )
                    .join(', ');
                text += ')';
            } else {
                text += event.sig;
            }
        }
        text += ';\n';
    }

    return text;
}

/**
 * Represents a `LOGn` instruction, or in Solidity terms, an `emit` statement.
 *
 * https://docs.soliditylang.org/en/latest/contracts.html#events
 */
export class Log implements IInst {
    readonly name = 'Log';

    constructor(
        readonly event: IEvents['events'][string] | undefined,
        readonly topics: Expr[],
        readonly mem: { offset: Expr; size: Expr },
        readonly args?: Expr[]
    ) {}

    get eventName(): string | undefined {
        if (this.event !== undefined && this.event.sig !== undefined) {
            return this.event.sig.split('(')[0];
        }
        return undefined;
    }

    eval() {
        return new Log(
            this.event,
            this.topics.map(e => e.eval()),
            { offset: this.mem.offset.eval(), size: this.mem.size.eval() },
            this.args?.map(e => e.eval())
        );
    }

    toString() {
        return this.eventName
            ? `emit ${this.eventName}(${[...this.topics.slice(1), ...(this.args ?? [])].join(
                  ', '
              )});`
            : 'log(' +
                  (this.args === undefined
                      ? [...this.topics, `memory[${this.mem.offset}:${this.mem.size} ]`].join(
                            ', '
                        ) + 'ii'
                      : [...this.topics, ...this.args].join(', ')) +
                  ');';
    }
}
