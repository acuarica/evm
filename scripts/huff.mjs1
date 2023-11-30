#!/usr/bin/env node
/* eslint-disable no-undef */

import { readFileSync } from 'fs';

import { EVM, huffState } from 'sevm';

function main() {
    const { bytecode } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const main = new EVM(bytecode).start();
    console.log(huffState(main));
}

main();
