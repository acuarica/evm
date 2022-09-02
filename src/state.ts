import { IsZero, LT, GT } from './inst/logic';
import { Add, Div } from './inst/math';
import { Sig } from './inst/logic';
import { CallDataLoad } from './inst/info';
import { CALL, Return, Revert } from './inst/system';
import { Stack } from './stack';
import { Sha3 } from './inst/sha3';
import { OPCODES } from './opcode';
import { Expr } from './inst/utils';

type INST = GT | LT | Sha3 | Add | Sig | IsZero | CALL | Div | CallDataLoad | Return | Revert;

export type Instruction =
    | {
          name: Exclude<
              | keyof typeof OPCODES
              | 'MappingStore'
              | 'REQUIRE'
              | 'MappingLoad'
              | 'LOG'
              | 'ReturnData'
              | 'SYMBOL'
              | 'Jumpi'
              | 'Jump',
              INST['name']
          >;
          type?: string | undefined;
          wrapped: boolean;
          toString: () => string;
      }
    | INST;

/**
 *
 */
export type Operand = bigint | Instruction;

/**
 *
 */
export class State {
    /**
     *
     */
    halted = false;

    /**
     *
     */
    readonly stmts: Instruction[] = [];

    /**
     *
     * @param stack
     * @param memory
     */
    constructor(
        readonly stack = new Stack<Expr>(),
        readonly memory: { [location: number]: Expr } = {}
    ) {}

    /**
     *
     * @returns
     */
    clone(): State {
        return new State(this.stack.clone(), { ...this.memory });
    }
}
