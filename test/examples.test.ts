import { strict as assert } from 'assert';
import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import { readdirSync } from 'fs';
import { extname } from 'path';

chai.use(chaiExec);

const ENABLE_EXAMPLES_TEST = process.env['ENABLE_EXAMPLES_TEST'];
const hint = !ENABLE_EXAMPLES_TEST ? ' (enable it by setting `ENABLE_EXAMPLES_TEST`)' : '';

describe(`::examples${hint}`, function () {
    readdirSync('./examples').filter(f => !f.endsWith('.html')).forEach(file => {
        it(file, function () {
            if (!ENABLE_EXAMPLES_TEST) this.skip();

            const ext = extname(file);
            assert(['.js', '.ts', '.mjs', '.mts'].includes(ext), `Invalid file extension \`${file}\``);

            // Increase timeout to avoid failing in CI
            this.timeout(30000);

            // Node's colorized output needs to be disabled for snapshot testing when running in CI
            // https://nodejs.org/api/cli.html#force_color1-2-3
            const env = { ...process.env, 'FORCE_COLOR': '0' };
            const program = ['.ts', '.mts'].includes(ext)
                ? `dist/examples/${file.slice(0, -ext.length)}${ext.replace('t', 'j')}`
                : `examples/${file}`;
            const cli = chaiExec('node', '--import=./scripts/mock.mjs', program, { env });

            expect(cli, cli.stderr).stderr.to.be.empty;
            expect(cli).stdout.to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });
    });
});
