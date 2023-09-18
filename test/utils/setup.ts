import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as c from 'ansi-colors';

const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16'] as const;

export async function mochaGlobalSetup() {
    mkdirSync('.solc', { recursive: true });

    process.stdout.write('solc setup ');

    await download('list.json');
    const { releases } = JSON.parse(readFileSync('./.solc/list.json', 'utf-8'));

    for (const version of VERSIONS) {
        const file = releases[version];
        await download(file, `${version}.js`);
    }

    console.info();
}

async function download(file: string, dst: string = file) {
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
