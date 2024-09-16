import { strict as assert } from 'assert';
import { readFileSync, readdirSync } from "fs";
import { join } from 'path';
import { JsonRpcProvider } from 'ethers';
import { Provider } from '../bin/.provider.mjs';

import {Contract} from 'sevm';
import 'sevm/4byte';
import 'sevm/4bytedb';

const BYTECODE_PATH = './test/mainnet';
/** @type {{[address_: string]: string}} */
const resolve = {};

for (const file of readdirSync(BYTECODE_PATH)) {
    assert(file.endsWith('.bytecode'));
    const [, address] = file.replace('.bytecode', '').split('-');
    assert(address, `Unable to register address with file \`${file}\``);
    resolve[address.toLowerCase()] = file;
}

/**
 * @param {string} address 
 * @returns {Promise<string>}
 */
function getCode(address) {
    const file = resolve[address.toLowerCase()];
    assert(file, `unable to find bytecode for address ${address}`);
    const bytecodePath = join(BYTECODE_PATH, file);
    // Normalize path so snapshot are the same in both Windows and *nixes
    console.info('[DEBUG mock.mjs]', address, bytecodePath.replace(/\\/g, '/'));
    const bytecode = readFileSync(bytecodePath, 'utf-8');
    return Promise.resolve(bytecode);
}

JsonRpcProvider.prototype.getCode = getCode;
Provider.prototype.getCode = getCode;

// @ts-ignore
Contract.prototype.patch = Contract.prototype.patchdb;
