const { providers } = require('ethers');
const { EVM } = require('../');
const provider = new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth');

const functionHashes = require('../data/functionHashes.min.json');
const eventHashes = require('../data/eventHashes.min.json');

(async () => {
    console.log('Getting code for `0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7` address...');
    const code = await provider.getCode('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7');
    const evm = new EVM(code, functionHashes, eventHashes);
    console.log(evm.decompile());
})();
