import { evalE, type Expr, type IInst } from '.';

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
        readonly offset: Expr,
        readonly size: Expr,
        readonly topics: Expr[],
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
            this.offset.eval(),
            this.size.eval(),
            this.topics.map(evalE),
            this.args?.map(evalE)
            // this.args
        );
    }
}
