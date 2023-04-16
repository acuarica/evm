import { providers } from 'ethers';
import { Contract } from '../src';
import '../src/selector';

const provider = new providers.EtherscanProvider();

(async () => {
    const address = '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7';
    const bytecode = await provider.getCode(address);
    console.time();
    const evm = new Contract(bytecode).patch();
    console.log(evm.decompile());
    console.timeEnd();
})();
