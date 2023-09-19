import { providers } from 'ethers';

import { Contract } from 'sevm';
import 'sevm/selector';

const provider = new providers.EtherscanProvider();

(async () => {
    const bytecode = await provider.getCode('0x3FDA67f7583380E67ef93072294a7fAc882FD7E7');
    const evm = new Contract(bytecode).patch();
    console.log(evm.decompile());
})();
