import { Assertion, expect } from 'chai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const UPDATE_SNAPSHOTS = process.env['UPDATE_SNAPSHOTS'];

export const maskTitle = (title: string) => title
    .replace(/^\.\./, '')
    .replace(/`/g, '')
    .replace(/^::/, '')
    .replace(/ /g, '-')
    .replace(/[:^'()|]/g, '_');

Assertion.addMethod('matchSnapshot', function (ext: string, ctx: Mocha.Context) {
    const actual = this._obj;
    if (typeof actual !== 'string') throw new TypeError('Actual value should be a string');
    if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

    const [root, ...titles] = ctx.test.titlePath();

    const snapshotFolder = `./test/__snapshots__/` + root.replace('::', '');
    mkdirSync(snapshotFolder, { recursive: true });

    const fileName = maskTitle(titles.map(t => t.replace(/^should /, '')).join('.'));
    const snapshotPath = `${snapshotFolder}/${fileName}.${ext}`;

    if (!existsSync(snapshotPath) || !!UPDATE_SNAPSHOTS) {
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
