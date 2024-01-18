import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import { readdirSync } from 'fs';

chai.use(chaiExec);

const ENABLE_EXAMPLES_TEST = process.env['ENABLE_EXAMPLES_TEST'];
const notice = !ENABLE_EXAMPLES_TEST ? ' (enable it by setting `ENABLE_4BYTE_TEST`)' : '';

describe(`::examples${notice}`, function () {
    const js = readdirSync('./examples').filter(f => f.endsWith('.mjs') || f.endsWith('.js'));

    js.forEach(file => {
        it(file, function () {
            if (!ENABLE_EXAMPLES_TEST) this.skip();
            this.timeout(10000);

            const cli = chaiExec(`examples/${file}`);

            expect(cli).to.exit.with.code(0);
            expect(cli).stdout.to.matchSnapshot('out', this);
            expect(cli).stderr.to.be.empty;
        });
    });
});
