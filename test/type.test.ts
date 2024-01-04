import { expect } from 'chai';

import { isElemType } from 'sevm';

describe('::type', function () {
    it('should determine `uint/function` as elem types', function () {
        expect(isElemType('uint')).to.be.true;
        expect(isElemType('function')).to.be.true;
    });
});
