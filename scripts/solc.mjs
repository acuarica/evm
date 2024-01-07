#!/usr/bin/env node
/* eslint-env node */

import c from 'ansi-colors';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import https from 'https';

/** 
 * @param {string} url 
 * @returns {Promise<string>}
 */
function get(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, function (res) {
            /** @type {Uint8Array | null} */
            let body = null;

            res.on('data', (/** @type {Uint8Array} */chunk) => {
                if (body == null) {
                    body = chunk;
                } else {
                    const newBody = new Uint8Array(body.length + chunk.length);
                    newBody.set(body, 0);
                    newBody.set(chunk, body.length);
                    body = newBody;
                }
            });

            res.on('end', () => {
                resolve(Buffer.from(/** @type {Uint8Array} */(body)).toString('utf8'));
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.end();
    });
}

const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16', '0.8.21'];

/** @typedef {{ [key: string]: string }} Releases */

/**
 * Fetch and cache `solc` compilers used in tests
 */
export async function mochaGlobalSetup() {
    // `recursive` ensures dir is created instead of failing with 'file already exists'
    mkdirSync('.solc', { recursive: true });
    process.stdout.write(c.magenta('> setup solc-js compilers '));

    const releases = await (async function () {
        const path = './.solc/releases.json';
        try {
            const ret = /** @type {Releases} */(JSON.parse(readFileSync(path, 'utf-8')));
            return ret;
        } catch (_err) {
            const resp = await get('https://binaries.soliditylang.org/bin/list.json');
            const { releases } = /** @type {{releases: Releases}} */(JSON.parse(resp));
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
            const resp = await get(`https://binaries.soliditylang.org/bin/${releases[version]}`);
            writeFileSync(path, resp);
            process.stdout.write(c.yellow('\u2913 '));
        }
    }
}
