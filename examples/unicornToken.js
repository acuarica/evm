const { Contract } = require('@acuarica/evm');
require('@acuarica/evm/selector');

const { providers } = require('ethers');

const provider = new providers.EtherscanProvider();

(async () => {
    console.log('Getting code for `0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7` address...');
    const code = await provider.getCode('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7');
    const evm = new Contract(code).patch();
    console.log(evm.decompile());
})();
