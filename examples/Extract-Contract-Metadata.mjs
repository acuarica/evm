#!/usr/bin/env -S FORCE_COLOR=0 node
/* eslint-env node */

import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';

// USDC Token Proxy on Avalanche Testnet
// https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65#code
const provider = new JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
const bytecode = await provider.getCode('0x5425890298aed601595a70AB815c96711a31Bc65');

const contract = new Contract(bytecode);
console.log(contract.metadata);
