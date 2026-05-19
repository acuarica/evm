import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import c from 'ansi-colors';

import { VERSIONS } from '../utils/solc.ts';

type Releases = { [key: string]: string; };

/**
 * It fetches and caches `solc` compilers used in tests.
 *
 * See https://vitest.dev/config/globalsetup for more info.
 */
export async function setup() {
    // `recursive` ensures dir is created instead of failing with 'file already exists'
    mkdirSync('.solc', { recursive: true });
    process.stdout.write(c.magenta('> setup solc-js compilers '));

    const releases = await (async function (path: string) {
        try {
            return JSON.parse(readFileSync(path, 'utf-8')) as Releases;
        } catch {
            const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
            // Serializes only `releases` property to avoid including `builds`
            // property which is unnecessary and clutters the file.
            const { releases } = await resp.json() as { releases: Releases };
            writeFileSync(path, JSON.stringify(releases, null, 2));
            return releases;
        }
    })('./.solc/releases.json');

    for (const version of VERSIONS) {
        process.stdout.write(`${c.cyan('v' + version)}`);
        // Use `cjs` extension because Solidity compilers are CommonJS modules.
        const path = `./.solc/soljson-v${version}.cjs`;

        if (existsSync(path)) {
            process.stdout.write(c.green('\u2713 '));
        } else {
            const resp = await fetch(`https://binaries.soliditylang.org/bin/${releases[version]}`);
            writeFileSync(path, await resp.text());
            process.stdout.write(c.yellow('\u2913 '));
        }
    }
    console.info();
}