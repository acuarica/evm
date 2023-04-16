const { Contract } = require('@acuarica/evm');
require('@acuarica/evm/selector');

const { providers } = require('ethers');

const provider = new providers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');

(async () => {
    const code = await provider.getCode('0x5425890298aed601595a70AB815c96711a31Bc65');
    const contract = new Contract(code).patch();
    console.log(contract.decompile());
})();
