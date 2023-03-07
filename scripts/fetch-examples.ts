import { providers } from 'ethers';
import { existsSync, writeFileSync } from 'fs';
import * as chalk from 'chalk';

const addr = chalk.blue;

const BASE_PATH = './test/smoke/';

const provider = new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth');

const addresses = [
    ['0x3FDA67f7583380E67ef93072294a7fAc882FD7E7', 'Compound'],
    ['0x06012c8cf97BEaD5deAe237070F9587f8E7A266d', 'CryptoKitties'],
    ['0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', 'DAI'],
    ['0x314159265dD8dbb310642f98f50C066173C1259b', 'ENS'],
    ['0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7', 'UnicornToken'],
    ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH'],
];

async function main() {
    for (const [address, name] of addresses) {
        const path = `${BASE_PATH}${name}-${address}.bytecode`;

        if (!existsSync(path)) {
            console.log(`Fetching code for ${name} at ${addr(address)} into ${BASE_PATH}`);
            const code = await provider.getCode(address);
            writeFileSync(path, code);
        } else {
            console.log(chalk.dim(`Code for ${name} at ${addr(address)} already fetched`));
        }
    }
}

main().catch(err => console.error(err));
