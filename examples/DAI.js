const { providers } = require('ethers');
const { EVM } = require('../');
const provider = new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth');

const functionHashes = require('../data/functionHashes.min.json');
const eventHashes = require('../data/eventHashes.min.json');

(async () => {
    const code = await provider.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359');
    const evm = new EVM(code, functionHashes, eventHashes);
    console.log(evm.decompile());
})();
