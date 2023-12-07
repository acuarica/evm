#!/usr/bin/env node
/* eslint-env node */

import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4byte';

const provider = new JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
const bytecode = await provider.getCode('0x5425890298aed601595a70AB815c96711a31Bc65');

const contract = new Contract(bytecode).patch();
console.info(contract.solidify());
