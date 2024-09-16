#!/usr/bin/env node

import { JsonRpcProvider } from 'ethers';
import { Contract, Memory, Shanghai, Stack, State } from 'sevm';
import type { Expr } from 'sevm/ast';

const provider = new JsonRpcProvider('https://cloudflare-eth.com/');
// https://etherscan.io/address/0x16A2D238d35e51Dd41Cf101dbb536E2cb9E233DA#code
const bytecode = await provider.getCode('0x16A2D238d35e51Dd41Cf101dbb536E2cb9E233DA');

new Contract(bytecode, new Shanghai(), new State(new Stack(), new class extends Memory<Expr> {
    override invalidateRange(offset: Expr, size: Expr, invalidateAll?: boolean): void {
        super.invalidateRange(offset, size, invalidateAll);
        size = size.eval();
        if (size.isVal() && size.val > this.maxInvalidateSizeAllowed) {
            console.log(size);
        }
    }
}));