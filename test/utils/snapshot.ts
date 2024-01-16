import { Assertion, expect } from 'chai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const UPDATE_SNAPSHOTS = process.env['UPDATE_SNAPSHOTS'];

export const maskTitle = (title: string) => title
    .replace(/^\.\./, '')
    .replace(/`/g, '')
    .replace(/^::/, '')
    .replace(/ /g, '-')
    .replace(/[:^'()|]/g, '_');

Assertion.addMethod('matchSnapshot', function (ext: string, ctx: Mocha.Context, titlePath?: string[]) {
    const actual = this._obj;
    if (typeof actual !== 'string') throw new TypeError('Actual value should be a string');
    if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

    const write = (line: string) => (output += line + '\n');
    const writeSnapshot = () => {
        write(tag);
        write(actual);
        write('```');
        ctx.test!.title += ` 📸 `;
    };

    const [root, ...titles] = titlePath ?? ctx.test.titlePath();
    const name = maskTitle(titles.map(t => t
        .replace(/^should /, '')
        .replace(/ #[0-9a-f]{6}/, '')
        .replace(' 🛠️', '')
        .replace(/--loads `solc-.*`/, '')
    ).join('/'));
    const tag = '```' + `${ext} ${name}`;

    const snapshotFile = `./test/__snapshots__/${maskTitle(root)}.snap.md`;
    const dir = dirname(snapshotFile);
    mkdirSync(dir, { recursive: true });

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
                ctx.test.title += ` 🎞️ `;
                expect(actual + '\n', `Snapshot: ${name}`).to.be.equal(snapshot);
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

Assertion.addMethod('matchFile', function (path: string, ctx: Mocha.Context) {
    const actual = this._obj;
    if (typeof actual !== 'string') throw new TypeError('Actual value should be a string');
    if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

    const snapshotPath = `./test/__snapshots__/${path}`;
    const dir = dirname(snapshotPath);
    mkdirSync(dir, { recursive: true });
    if (!existsSync(snapshotPath) || !!UPDATE_SNAPSHOTS) {
        writeFileSync(snapshotPath, actual);
        ctx.test.title += ` 📸 `;
    } else {
        ctx.test.title += ` 🎞️ `;
        const expected = readFileSync(snapshotPath, 'utf8');
        expect(actual, `Snapshot file: ${path}`).to.be.equal(expected);
    }
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Chai {
        interface Assertion {
            matchSnapshot(ext: string, ctx: Mocha.Context, titlePath?: string[]): Assertion;
            matchFile(path: string, ctx: Mocha.Context): Assertion;
        }
    }
}
