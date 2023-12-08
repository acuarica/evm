import { Block, Expr, Prop } from '../ast';
import { Stack } from '../state';

Block.qw = new Prop(['asdf', 'uint']);

export const STEP = {
    PREVRANDAO: [
        0x44,
        ({ stack }: { stack: Stack<Expr> }) => {
            stack.push(Block.qw);
        },
    ],
};
