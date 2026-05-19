import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { expect } from 'vitest';

const maskPath = (path: string) => path
    .replace(/ /g, '-');

expect.extend({
    matchSnapshotmd(actual, ext: string, path?: string) {
        if (typeof actual !== 'string') {
            actual = JSON.stringify(actual, undefined, 2);
        }

        const write = (line: string) => (output += line + '\n');
        const writeSnapshot = () => {
            write(tag);
            write(actual);
            write('```');
            this.task?.context.annotate(`📸 Snapshot '${ext}' taken`)
        };

        const snapshotPath = this.snapshotState.snapshotPath.replace('.test.ts', '');
        const [snapshotFile, h1] = path === undefined
            ? [`${snapshotPath}.md`, this.task?.file.name]
            : [`${snapshotPath}/${maskPath(path)}.md`, path];
        const snapshotDir = dirname(snapshotFile);
        mkdirSync(snapshotDir, { recursive: true });

        const name = this.currentTestName;
        const tag = '```' + `${ext} ${name}`;

        // @ts-expect-error Property '_updateSnapshot' is private and only accessible within class 'SnapshotState'
        const updateSnapshot = this.snapshotState._updateSnapshot === 'all';
        const content = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf8') : `# ${h1}\n`;

        let marker: 'NOT_SEEN' | 'OPEN' | 'CLOSED' = 'NOT_SEEN';
        let output = '';
        let expected: string | undefined = undefined;
        for (const line of content.split('\n')) {
            if (line === tag && marker === 'NOT_SEEN') {
                marker = 'OPEN';
                expected = '';
            } else if (marker === 'OPEN' && line === '```') {
                if (updateSnapshot) {
                    writeSnapshot();
                    marker = 'CLOSED';
                } else {
                    this.task?.context.annotate(`🎞️ Snapshot \`${ext}\` found`)
                    const pass = actual + '\n' === expected;
                    const message = pass ? () => '' : () => 'Snapshot as';
                    return { pass, message, actual: actual + '\n', expected };
                }
            } else if (marker === 'OPEN') {
                expected += line + '\n';
            } else {
                write(line);
            }
        }

        if (marker === 'NOT_SEEN') {
            write(`## \`${ext}\` ${name}\n`);
            writeSnapshot();
        }

        writeFileSync(snapshotFile, output.trimEnd() + '\n');
        return { message: () => '', pass: true };
    }
});

expect.extend({
    matchFile(actual, filename: string) {
        if (typeof actual !== 'string')
            throw new TypeError('Actual value should be a string');

        // @ts-expect-error Property '_updateSnapshot' is private and only accessible within class 'SnapshotState'
        const updateSnapshot = this.snapshotState._updateSnapshot === 'all';

        const snapshotPath = this.snapshotState.snapshotPath.replace('.test.ts', '');
        const snapshotFile = `${snapshotPath}/${filename}`;
        const snapshotDir = dirname(snapshotFile);
        mkdirSync(snapshotDir, { recursive: true });

        if (!existsSync(snapshotFile) || updateSnapshot) {
            writeFileSync(snapshotFile, actual);
            this.task?.context.annotate(`📸 File snapshot '${filename}' taken`)
            return { message: () => '', pass: true };
        } else {
            this.task?.context.annotate(`🎞️ Snapshot \`${filename}\` found`)
            const expected = readFileSync(snapshotFile, 'utf8');
            expect(actual, `Snapshot file: ${filename}`).to.be.equal(expected);
            const pass = actual === expected;
            const message = pass ? () => '' : () => `Snapshot file ${filename}`;
            return { pass, message, actual, expected };
        }
    }
});