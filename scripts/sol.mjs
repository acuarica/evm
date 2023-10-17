#!/usr/bin/env node
/* eslint-disable no-undef */

import { readFileSync } from 'fs';
import { Contract } from 'sevm';

const path = process.argv[2];
const { bytecode } = JSON.parse(readFileSync(path, 'utf8'));
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
console.info(new Contract(bytecode).decompile());
