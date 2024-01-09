import { Assertion, expect } from 'chai';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { Runnable, Suite } from 'mocha';

const title = (test: Runnable | Suite | undefined): string =>
    test ? title(test.parent) + '.' + test.title.replace(/^should /, '') : '';

const fullTitle = (ctx: Mocha.Context) => title(ctx.test)
    .replace(/^../, '')
    .replace(/`/g, '')
    .replace(/^::/, '')
    .replace(/ /g, '-')
    .replace(/[:^'()]/g, '_');

Assertion.addMethod('matchSnapshot', function (ext: string, ctx: Mocha.Context) {
    const actual = this._obj;
    if (typeof actual !== 'string') throw new TypeError('Actual value should be a string');
    if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

    const id = fullTitle(ctx);
    const snapshotPath = `./test/__snapshots__/${id}.${ext}`;

    if (!existsSync(snapshotPath)) {
        writeFileSync(snapshotPath, actual, 'utf-8');
        ctx.test.title += ` 📸 `;
    } else {
        ctx.test.title += ` 🎞️ `;
        const snapshot = readFileSync(snapshotPath, 'utf8');
        expect(actual).to.be.equal(snapshot);
    }
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Chai {
        interface Assertion {
            matchSnapshot(ext: string, ctx: Mocha.Context): Assertion;
        }
    }
}
