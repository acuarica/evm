const { EtherscanProvider } = require('ethers');

const { Contract } = require('sevm');
require('sevm/selector');

const provider = new EtherscanProvider();

(async () => {
    const code = await provider.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359');
    const contract = new Contract(code).patch();
    console.log(contract.decompile());
})();
