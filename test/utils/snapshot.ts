import { Assertion, expect } from 'chai';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

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
    if (ctx.test.file === undefined) throw new TypeError('Context test file is not defined');

    const [root, ...titles] = ctx.test.titlePath();

    const write = (line: string) => (output += line + '\n');
    const writeSnapshot = () => {
        write(tag);
        write(actual);
        write('```');
        ctx.test!.title += ` 📸 `;
    };

    const name = maskTitle(titles.map(t => t.replace(/^should /, '')).join('/'));
    const tag = '```' + `${ext} ${name}`;

    const snapshotFile = `./test/__snapshots__/${basename(ctx.test.file)}.snap.md`;
    const content = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf8') : `# ${root}\n`;
    let marker: 'NOT_SEEN' | 'OPEN' | 'CLOSED' = 'NOT_SEEN';
    let output = '';
    let snapshot: string | undefined = undefined;
    for (const line of content.split('\n')) {
        if (line === tag && marker === 'NOT_SEEN') {
            marker = 'OPEN';
            snapshot = '';
        } else if (marker === 'OPEN' && line === '```') {
            if (UPDATE_SNAPSHOTS) {
                writeSnapshot();
                marker = 'CLOSED';
            } else {
                expect(actual + '\n', `Snapshot: ${name}`).to.be.equal(snapshot);
                ctx.test.title += ` 🎞️ `;
                return;
            }
        } else if (marker === 'OPEN') {
            snapshot += line + '\n';
        } else {
            write(line);
        }
    }

    if (marker === 'NOT_SEEN') {
        writeSnapshot();
    }

    writeFileSync(snapshotFile, output.trimEnd() + '\n');
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Chai {
        interface Assertion {
            matchSnapshot(ext: string, ctx: Mocha.Context): Assertion;
        }
    }
}
