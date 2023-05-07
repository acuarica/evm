import { readFileSync, writeFileSync } from 'fs';
import c from 'ansi-colors';

const MARKER = process.env['MARKER'];

function main() {
    if (!MARKER) {
        throw new Error('Missing `MARKER` env variable');
    }

    const BEGIN_MARKER = `<!-- BEGIN:${MARKER} -->`;
    const END_MARKER = `<!-- END:${MARKER} -->`;

    const args = process.argv.slice(2);
    if (args.length !== 1) {
        throw new Error('Invalid number of arguments');
    }

    const readme = readFileSync(args[0], 'utf8');

    /**
     * @type {'NOT_SEEN' | 'OPEN' | 'CLOSED'}
     */
    let marker = 'NOT_SEEN';
    let output = '';
    const write = (/** @type string */line) => output += line + '\n';

    for (let line of readme.split('\n')) {
        line = line.trim();
        if (line === BEGIN_MARKER && marker === 'NOT_SEEN') {
            marker = 'OPEN';
        } else if (line === END_MARKER && marker === 'OPEN') {
            write(BEGIN_MARKER);
            write('```sh');

            const help = readFileSync(0, 'utf8');
            write(help);

            write('```');
            write(END_MARKER);

            marker = 'CLOSED';
        } else if (marker !== 'OPEN') {
            write(line);
        }
    }

    if (marker === 'NOT_SEEN') {
        throw new Error(`Could not find marker \`${MARKER}\``);
    }

    writeFileSync(args[0], output.trimEnd() + '\n');
}

try {
    main();
} catch (err) {
    const warn = c.yellow;
    console.warn(warn((/** @type Error */(err)).message));
}
