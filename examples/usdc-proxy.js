const { providers } = require('ethers');
const { EVM } = require('../');
const provider = new providers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');

const functionHashes = require('../data/functionHashes.min.json');
const eventHashes = require('../data/eventHashes.min.json');

(async () => {
    const code = await provider.getCode('0x5425890298aed601595a70AB815c96711a31Bc65');
    const evm = new EVM(code, functionHashes, eventHashes);
    console.log(evm.getBytecode());
    console.log(evm.decompile());
})();
