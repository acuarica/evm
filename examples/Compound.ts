import { providers } from 'ethers';
import { Contract } from '../src';
import { patch } from '../test/utils/selector';

const provider = new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth');

(async () => {
    const address = '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7';
    const bytecode = await provider.getCode(address);
    console.time();
    const evm = patch(new Contract(bytecode));
    console.log(evm.decompile());
    console.timeEnd();
})();
