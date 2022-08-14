const functionHashes = require("../data/functionHashes.json");
const eventHashes = require("../data/eventHashes.json");

const ethers = require('ethers');
const { EVM } = require("../");
const provider = new ethers.providers.JsonRpcProvider("https://api.mycryptoapi.com/eth");

(async () => {
    console.log('Getting code for `0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7` address...')
    const code = await provider.getCode("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7");
    const evm = new EVM(code, functionHashes, eventHashes);
    console.log(evm.decompile());
})();
