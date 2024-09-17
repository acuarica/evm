import { strict as assert } from 'assert';
import { readFileSync, readdirSync } from "fs";
import { join } from 'path';
import { JsonRpcProvider } from 'ethers';

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

// Patch the following to avoid requests in `::examples` tests 
JsonRpcProvider.prototype.getCode = getCode;

// Patch the following to avoid requests in `::bin/provider` tests 
global.fetch = async function (url, payload) {
    assert(typeof url === 'string');

    console.info('[DEBUG mock.mjs]', `url='${url}'`, `payload=${JSON.stringify(payload)}`);

    if (payload?.method === 'POST') {
        assert(typeof payload === 'object');
        assert(typeof payload['body'] === 'string');
        const { id, jsonrpc, method, params } = JSON.parse(payload['body']);
        assert(id);
        assert(jsonrpc === '2.0');
        assert(method === 'eth_getCode');
        const [address] = params;

        const code = await getCode(address);
        const resp = JSON.stringify({ id, jsonrpc, result: code });
        return Promise.resolve(new Response(resp, payload));
    }

    assert(url.startsWith('https://api.openchain.xyz/signature-database/v1/lookup?'));
    url = new URL(url);

    const getHashes = (/**@type {'function'|'event'}*/kind, /**@type{URL}*/url) => {
        const selectors = url.searchParams.get(kind);
        assert(selectors !== null);
        const hashes = JSON.parse(readFileSync(`./4bytedb/${kind}Hashes.min.json`, 'utf-8'));
        return Object.fromEntries(selectors
            .split(',')
            .map(s => [s, [{ name: hashes[s.slice(2)], filtered: false }]]));
    };
    const resp = JSON.stringify({
        result: {
            function: getHashes('function', url),
            event: getHashes('event', url),
        }
    });
    return Promise.resolve(new Response(resp, payload));
};
