import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import { readdirSync } from 'fs';

chai.use(chaiExec);

const ENABLE_EXAMPLES_TEST = process.env['ENABLE_EXAMPLES_TEST'];
const hint = !ENABLE_EXAMPLES_TEST ? ' (enable it by setting `ENABLE_EXAMPLES_TEST`)' : '';

describe(`::examples${hint}`, function () {
    const js = readdirSync('./examples')
        .filter(f => f.endsWith('.mjs') || f.endsWith('.js') || f.endsWith('.ts'));

    js.forEach(file => {
        it(file, function () {
            if (!ENABLE_EXAMPLES_TEST) this.skip();
            // Increase timeout to avoid failing in CI
            this.timeout(20000);

            // Node's colorized output needs to be disabled for snapshot testing when running in CI
            // https://nodejs.org/api/cli.html#force_color1-2-3
            const env = { ...process.env, 'FORCE_COLOR': '0' };
            const cli = file.endsWith('.ts')
                ? chaiExec('node', `dist/examples/${file.slice(0, -3)}.js`, { env })
                : chaiExec(`examples/${file}`, { env });

            expect(cli).stderr.to.be.empty;
            expect(cli).stdout.to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });
    });
});
