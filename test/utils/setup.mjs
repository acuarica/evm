import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import c from 'ansi-colors';

const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16'];

export async function mochaGlobalSetup() {
    mkdirSync('.solc', { recursive: true });

    process.stdout.write('solc setup ');

    const releases = await (async function () {
        const path = './.solc/releases.json';
        try {
            return JSON.parse(readFileSync(path, 'utf-8'));
        } catch (_err) {
            const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
            if (resp.ok) {
                const releases = (await resp.json()).releases;
                writeFileSync(path, JSON.stringify(releases, null, 2));
                return releases;
            } else {
                throw new Error('cannot fetch `list.json`');
            }
        }
    })();

    for (const version of VERSIONS) {
        // const file = (releases as { [k: string]: string})[version];
        const file = releases[version];
        await download(file, `soljson-v${version}.js`);
    }

    console.info();
}

/**
 * @param {string} file
 * @param {string} dst
 */
async function download(file, dst) {
    process.stdout.write(`${c.cyan(dst)}`);
    const path = `./.solc/${dst}`;

    if (existsSync(path)) {
        process.stdout.write(c.green('\u2713 '));
    } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const resp = await fetch(`https://binaries.soliditylang.org/bin/${file}`);
        if (resp.ok) {
            writeFileSync(path, await resp.text());
            process.stdout.write(c.yellow('\u2913 '));
        } else {
            console.info(c.red(`${resp.status}  ${resp.statusText}`));
        }
    }
}
