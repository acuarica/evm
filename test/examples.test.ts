import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import { readdirSync } from 'fs';

chai.use(chaiExec);

const ENABLE_EXAMPLES_TEST = process.env['ENABLE_EXAMPLES_TEST'];
const notice = !ENABLE_EXAMPLES_TEST ? ' (enable it by setting `ENABLE_4BYTE_TEST`)' : '';

describe(`::examples${notice}`, function () {
    const js = readdirSync('./examples')
        .filter(f => f.endsWith('.mjs') || f.endsWith('.js') || f.endsWith('.ts'));

    js.forEach(file => {
        it(file, function () {
            if (!ENABLE_EXAMPLES_TEST) this.skip();
            this.timeout(10000);

            const script = file.endsWith('.ts') ? `dist/examples/${file.slice(0, -3)}.js` : `examples/${file}`;
            const cli = chaiExec('node', script);

            expect(cli).stderr.to.be.empty;
            expect(cli).stdout.to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });
    });
});
