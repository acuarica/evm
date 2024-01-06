#!/usr/bin/env node
/* eslint-env node */

import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4byte';

// Compound Contract
// https://etherscan.io/address/0x3FDA67f7583380E67ef93072294a7fAc882FD7E7#code
const bytecode = await new Provider().getCode('0x3FDA67f7583380E67ef93072294a7fAc882FD7E7');

const contract = new Contract(bytecode).patch(); // Lookup for 4byte matches
console.log(contract.solidify()); //Decompile bytecode to Solidity
