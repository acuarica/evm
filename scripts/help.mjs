#!/usr/bin/env node
/* eslint-env node */

import { readFileSync, writeFileSync } from 'fs';
import c from 'ansi-colors';
import { execSync } from 'child_process';

function main() {
    const BEGIN_MARKER = /^```\w+$/;
    const END_MARKER = '```';

    const args = process.argv.slice(2);
    if (args.length !== 1) {
        throw new Error('Invalid number of arguments');
    }

    const readme = readFileSync(args[0], 'utf8');

    let marker = null;
    let output = '';
    const write = (/** @type string */ line) => (output += line + '\n');

    for (const line of readme.split('\n')) {
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(' ');
        if (parts.length >= 2 && parts[0].match(BEGIN_MARKER) && parts[1] !== '' && marker === null) {
            process.stdout.write(`Opening marker ${c.magenta(trimmedLine)} .. `);
            marker = trimmedLine;
        } else if (trimmedLine === END_MARKER && marker !== null) {
            write(marker);
            const file = marker.substring(marker.indexOf(' ') + 1);
            let content;
            if (file.startsWith('!')) {
                const parts = file.substring(1).split(' ');
                const bin = parts[0].split('=');
                const [alias, cmd] = bin.length === 1 ? [bin[0], bin[0]] : [bin[0], bin[1]];

                parts[0] = alias;
                write(`$ ${parts.join(' ')}`);

                parts[0] = cmd;
                content = execSync(parts.join(' '), { encoding: 'utf8' });
                console.info('exec', c.cyan(file));
            } else {
                content = readFileSync(file, 'utf8');
                content = content
                    .replace('#!/usr/bin/env NODE_DISABLE_COLORS=1 node', '')
                    .replace(/\/\* eslint-.+ \*\//g, '')
                    .trim();

                console.info('verbatim', c.cyan(file));
            }
            write(content);
            write(END_MARKER);

            marker = null;
        } else if (marker === null) {
            write(line);
        }
    }

    writeFileSync(args[0], output.trimEnd() + '\n');
}

try {
    main();
} catch (err) {
    console.warn(c.yellow(/** @type Error */(err).message));
}
