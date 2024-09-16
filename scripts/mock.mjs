import { strict as assert } from 'assert';
import { readFileSync, readdirSync } from "fs";
import { join } from 'path';
import { JsonRpcProvider } from 'ethers';
import { Provider } from '../bin/.provider.mjs';

const BYTECODE_PATH = './test/mainnet';
/** @type {{[address_: string]: string}} */
const resolve = {};

for (const file of readdirSync(BYTECODE_PATH)) {
    assert(file.endsWith('.bytecode'));
    const [, address] = file.replace('.bytecode', '').split('-');
    assert(address, `Unable to register address with file \`${file}\``);
    resolve[address.toLowerCase()] = file;
}

function getCode(/** @type {string} */ address) {
    const file = resolve[address.toLowerCase()];
    assert(file, `unable to find bytecode for address ${address}`);
    const bytecodePath = join(BYTECODE_PATH, file);
    console.info('[DEBUG mock.mjs]', address, bytecodePath);
    const bytecode = readFileSync(bytecodePath, 'utf-8');
    return Promise.resolve(bytecode);
}

JsonRpcProvider.prototype.getCode = getCode;
Provider.prototype.getCode = getCode;
