const { readFileSync, writeFileSync } = require("fs");

function main() {
    const BEGIN_MARKER = '<!-- BEGIN:--help -->';
    const END_MARKER = '<!-- END:--help -->';

    const args = process.argv.slice(2);
    if (args.length !== 1) {
        throw new Error('Invalid number of arguments');
    }

    const readme = readFileSync(args[0], 'utf8');

    let isOpen = false;
    let output = '';
    const write = (/** @type string */line) => output += line + '\n';

    for (let line of readme.split('\n')) {
        line = line.trim();
        if (line === BEGIN_MARKER) {
            isOpen = true;
        } else if (line === END_MARKER && isOpen) {
            write(BEGIN_MARKER);
            write('```sh');

            const help = readFileSync(0, 'utf8');
            write(help);

            write('```');
            write(END_MARKER);

            isOpen = false;
        } else if (!isOpen) {
            write(line);
        }
    }

    writeFileSync(args[0], output.trimEnd() + '\n');
}

try {
    main();
} catch (err) {
    console.warn((/** @type Error */(err)).message);
}
