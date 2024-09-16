#!/usr/bin/env node
/* eslint-env node */

import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

const provider = new JsonRpcProvider('https://cloudflare-eth.com/');
// WETH Contract
// https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
const bytecode = await provider.getCode('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

const contract = new Contract(bytecode).patchdb(); // Lookup for 4byte matches
console.log(contract.solidify()); // Decompile bytecode to Solidity
