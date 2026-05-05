#!/usr/bin/env node

import { getHashes, hash } from 'node:crypto';

import js_sha3 from 'js-sha3';

function main() {
    console.log(process.versions);
    console.log(getHashes());

    console.log(js_sha3.keccak256(''));
    console.log(js_sha3.keccak256(new Uint8Array()));
    console.log(hash('sha3-256', ''));
    console.log(hash('sha3-256', new Uint8Array()));
    console.log(hash('keccak-256', ''));
}

main();