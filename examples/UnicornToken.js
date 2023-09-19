const { providers } = require('ethers');

const { Contract } = require('sevm');
require('sevm/selector');

const provider = new providers.EtherscanProvider();

(async () => {
    const code = await provider.getCode('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7');
    const contract = new Contract(code).patch();
    console.log(contract.decompile());
})();
