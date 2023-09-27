import { type Expr, type IInst } from './expr';

/**
 * Events found through `LOG` instructions.
 *
 * The `topic` is represented as a hex string.
 */
export interface IEvents {
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
}

/**
 * Represents a `LOGn` instruction, or in Solidity terms, an `emit` statement.
 *
 * https://docs.soliditylang.org/en/latest/contracts.html#events
 */
export class Log implements IInst {
    readonly name = 'Log';

    constructor(
        readonly event: IEvents[string] | undefined,
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
