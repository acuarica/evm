#!/usr/bin/env node

import { EtherscanProvider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm-4byte';

const provider = new EtherscanProvider();
const bytecode = await provider.getCode('0x3FDA67f7583380E67ef93072294a7fAc882FD7E7');

const contract = new Contract(bytecode).patch();
console.info(contract.decompile());
