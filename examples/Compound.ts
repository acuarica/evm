import { providers } from 'ethers';
import { EVM } from '../';

import * as functionHashes from '../data/functionHashes.min.json';
import * as eventHashes from '../data/eventHashes.min.json';

const provider = new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth');

(async () => {
    const address = '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7';
    const code = await provider.getCode(address);
    console.time();
    const evm = new EVM(code, functionHashes, eventHashes);
    console.log(evm.decompile());
    console.timeEnd();
})();
