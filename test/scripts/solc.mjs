#!/usr/bin/env node
/* eslint-env node */

import c from 'ansi-colors';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16', '0.8.21'];

/**
 * Fetch and cache `solc` compilers used in tests.
 */
export async function mochaGlobalSetup() {
    /** @typedef {{ [key: string]: string }} Releases */

    // `recursive` ensures dir is created instead of failing with 'file already exists'
    mkdirSync('.solc', { recursive: true });
    process.stdout.write(c.magenta('> setup solc-js compilers '));

    const releases = await (async function () {
        const path = './.solc/releases.json';
        try {
            const ret = /** @type {Releases} */(JSON.parse(readFileSync(path, 'utf-8')));
            return ret;
        } catch (_err) {
            const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
            // Serializes only `releases` property to avoid including `builds`
            // property which is unnecessary and clutters the file.
            const { releases } = /** @type {{releases: Releases}} */(await resp.json());
            writeFileSync(path, JSON.stringify(releases, null, 2));
            return releases;
        }
    })();

    for (const version of VERSIONS) {
        process.stdout.write(`${c.cyan('v' + version)}`);
        const path = `./.solc/soljson-v${version}.js`;

        if (existsSync(path)) {
            process.stdout.write(c.green('\u2713 '));
        } else {
            const resp = await fetch(`https://binaries.soliditylang.org/bin/${releases[version]}`);
            writeFileSync(path, await resp.text());
            process.stdout.write(c.yellow('\u2913 '));
        }
    }
}
