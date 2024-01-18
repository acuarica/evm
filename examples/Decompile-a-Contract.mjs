#!/usr/bin/env -S NODE_DISABLE_COLORS=1 node
/* eslint-env node */

import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

// WETH Contract
// https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
const bytecode = await new Provider().getCode('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

const contract = new Contract(bytecode).patchdb(); // Lookup for 4byte matches
console.log(contract.solidify()); //Decompile bytecode to Solidity
