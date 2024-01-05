#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const { Contract } = require('sevm');

const contract = new Contract('0x00');
console.log(contract.solidify());
