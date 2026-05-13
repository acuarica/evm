import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { expect } from 'vitest';

const maskPath = (path: string) => path
    .replace(/ /g, '-');

expect.extend({
    matchSnapshotmd(actual, ext: string, path?: string) {
        if (typeof actual !== 'string')
            throw new TypeError('Actual value should be a string');

        const write = (line: string) => (output += line + '\n');
        const writeSnapshot = () => {
            write(tag);
            write(actual);
            write('```');
            this.task?.context.annotate(`📸 Snapshot '${ext}' taken`)
        };

        const snapshotPath = this.snapshotState.snapshotPath.replace('.test.ts', '');
        const [snapshotFile, h1] = path === undefined
            ? [snapshotPath + '.md', this.task?.file.name]
            : [snapshotPath + '/' + maskPath(path) + '.md', path];
        const snapshotDir = dirname(snapshotFile);
        mkdirSync(snapshotDir, { recursive: true });

        const name = this.currentTestName;
        const tag = '```' + `${ext} ${name}`;

        // @ts-expect-error Property '_updateSnapshot' is private and only accessible within class 'SnapshotState'
        const updateSnapshot = this.snapshotState._updateSnapshot === 'all';
        const content = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf8') : `# ${h1}\n`;

        let marker: 'NOT_SEEN' | 'OPEN' | 'CLOSED' = 'NOT_SEEN';
        let output = '';
        let snapshot: string | undefined = undefined;
        for (const line of content.split('\n')) {
            if (line === tag && marker === 'NOT_SEEN') {
                marker = 'OPEN';
                snapshot = '';
            } else if (marker === 'OPEN' && line === '```') {
                if (updateSnapshot) {
                    writeSnapshot();
                    marker = 'CLOSED';
                } else {
                    this.task?.context.annotate(`🎞️ Snapshot \`${ext}\` found`)
                    const pass = actual + '\n' === snapshot;
                    return {
                        pass,
                        message: pass ? () => '' : () => 'Snapshot as',
                        actual: actual + '\n',
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
            write(`## \`${ext}\` ${name}\n`);
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
