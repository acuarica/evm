import { expect } from 'chai';
import { Val } from '../src/evm/expr';
import { Log } from '../src/evm/log';
import { IsZero } from '../src/evm/logic';
import { Add, Mul } from '../src/evm/math';

import '../src/yul';

describe('yul', function () {
    it.skip('should run', function () {
        const expr = new IsZero(new Add(new Val(1n), new Mul(new Val(3n), new Val(2n))));
        expect(expr).to.be.null;
    });

    it.skip('should runi', function () {
        const inst = new Log(undefined, [new Val(3n)], { offset: new Val(0n), size: new Val(32n) });
        expect(inst).to.be.null;
    });
});
