import type { State } from '../state';
import { type Expr, type Inst, type IInst } from './expr';
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
export declare function stringifyEvents(events: IEvents['events']): string;
export declare class Log implements IInst {
    readonly event: IEvents['events'][string] | undefined;
    readonly topics: Expr[];
    readonly args: Expr[];
    readonly mem?: {
        offset: Expr;
        size: Expr;
    } | undefined;
    readonly name = "Log";
    constructor(event: IEvents['events'][string] | undefined, topics: Expr[], args: Expr[], mem?: {
        offset: Expr;
        size: Expr;
    } | undefined);
    get eventName(): string | undefined;
    eval(): Log;
    toString(): string;
}
export declare const LOGS: (events: IEvents) => {
    LOG0: ({ stack, memory, stmts }: State<Inst, Expr>) => void;
    LOG1: ({ stack, memory, stmts }: State<Inst, Expr>) => void;
    LOG2: ({ stack, memory, stmts }: State<Inst, Expr>) => void;
    LOG3: ({ stack, memory, stmts }: State<Inst, Expr>) => void;
    LOG4: ({ stack, memory, stmts }: State<Inst, Expr>) => void;
};
