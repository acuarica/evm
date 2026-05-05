import { expect } from 'vitest';

// import { Assertion, expect } from 'chai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const UPDATE_SNAPSHOTS = process.env['UPDATE_SNAPSHOTS'];

export const maskTitle = (title: string) => title
    .replace(/^\.\./, '')
    .replace(/`/g, '')
    .replace(/^::/, '')
    .replace(/ /g, '-')
    .replace(/[:^'()|]/g, '_');

// Assertion.addMethod('matchSnapshot', function (ext: string, ctx: Mocha.Context, titlePath?: string[]) {
expect.extend({
    matchSnapshotmd(received, ext: string) {

        // const actual = this._obj as unknown;
        if (typeof received !== 'string') throw new TypeError('Actual value should be a string');
        console.log(this.currentTestName)
        // if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

        const write = (line: string) => (output += line + '\n');
        const writeSnapshot = () => {
            write(tag);
            write(received);
            write('```');
            this.task?.context.annotate('📸 Snapshot taken')
            // ctx.test!.title += ` 📸 `;
        };

        // console.log(this);

        // @ts-expect-error Property '_updateSnapshot' is private and only accessible within class 'SnapshotState'
        const updateSnapshot = this.snapshotState._updateSnapshot === 'all';
        // console.log(updateSnapshot);
        const h1 = this.task?.file.name;
        // const titlePath = this.currentTestName;
        // const [root, ...titles] = titlePath ;//?? ctx.test.titlePath();
        // const name2 = maskTitle(titles.map(t => t
        //     .replace(/^should /, '')
        //     .replace(/ #[0-9a-f]{6}/, '')
        //     .replace(' 🛠️', '')
        //     .replace(' 📸 ', '')
        //     .replace(' 🎞️ ', '')
        //     .replace(/--loads `solc-.*`/, '')
        // ).join('/'));
        const name = this.currentTestName;
        const tag = '```' + `${ext} ${name}`;

        // const snapshotFile = `./test/__snapshots__/${maskTitle(root)}.snap.md`;
        const snapshotFile = this.snapshotState.snapshotPath + '.md';
        const dir = dirname(snapshotFile);
        mkdirSync(dir, { recursive: true });

        const content = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf8') : `# ${h1}\n`;
        let marker: 'NOT_SEEN' | 'OPEN' | 'CLOSED' = 'NOT_SEEN';
        let output = '';
        let snapshot: string | undefined = undefined;
        for (const line of content.split('\n')) {
            if (line === tag && marker === 'NOT_SEEN') {
                marker = 'OPEN';
                snapshot = '';
            } else if (marker === 'OPEN' && line === '```') {
                if (UPDATE_SNAPSHOTS || updateSnapshot) {
                    writeSnapshot();
                    marker = 'CLOSED';
                } else {
                    this.task?.context.annotate('🎞️ Snapshot found')
                    // ctx.test.title += ` 🎞️ `;
                    // expect(received + '\n', `Snapshot: ${name}`).to.be.equal(snapshot);
                    const pass = received + '\n' === snapshot;
                    return {
                        pass,
                        message: pass ? () => '' : () => 'Snapshot as',
                        actual: received + '\n',
                        expected: snapshot,
                    };
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

        return {
            message: () => '',
            pass: true,
        }
    }
});

// Assertion.addMethod('matchFile', function (path: string, ctx: Mocha.Context) {
//     const actual = this._obj as unknown;
//     if (typeof actual !== 'string') throw new TypeError('Actual value should be a string');
//     if (ctx.test === undefined) throw new TypeError('Mocha context is not defined');

//     const snapshotPath = `./test/__snapshots__/${path}`;
//     const dir = dirname(snapshotPath);
//     mkdirSync(dir, { recursive: true });
//     if (!existsSync(snapshotPath) || !!UPDATE_SNAPSHOTS) {
//         writeFileSync(snapshotPath, actual);
//         ctx.test.title += ` 📸 `;
//     } else {
//         ctx.test.title += ` 🎞️ `;
//         const expected = readFileSync(snapshotPath, 'utf8');
//         expect(actual, `Snapshot file: ${path}`).to.be.equal(expected);
//     }
// });

// declare global {
//     // eslint-disable-next-line @typescript-eslint/no-namespace
//     export namespace Chai {
//         interface Assertion {
//             matchSnapshot(ext: string, ctx: Mocha.Context, titlePath?: string[]): Assertion;
//             matchFile(path: string, ctx: Mocha.Context): Assertion;
//         }
//     }
// }


declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> {
        matchSnapshotmd: (ext: string) => T,
    }
}