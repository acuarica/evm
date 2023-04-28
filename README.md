# EVM Bytecode Decompiler

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/acuarica/evm/main.yaml?style=flat-square)](https://github.com/acuarica/evm/actions/workflows/main.yaml)
![nycrc config on GitHub](https://img.shields.io/nycrc/acuarica/evm?style=flat-square)
[![npm (scoped)](https://img.shields.io/npm/v/@acuarica/evm?style=flat-square)](https://www.npmjs.com/package/@acuarica/evm)
![npm](https://img.shields.io/npm/dt/@acuarica/evm)
[![GitHub](https://img.shields.io/github/license/acuarica/evm?style=flat-square)](https://github.com/acuarica/evm/blob/master/LICENSE)
[![Demo](https://img.shields.io/badge/demo-acuarica.github.io%2Fevm-informational?style=flat-square)](https://acuarica.github.io/evm)

A Symbolic [Ethereum Virtual Machine (EVM)](https://medium.com/mycrypto/the-ethereum-virtual-machine-how-does-it-work-9abac2b7c9e) interpreter and decompiler, along with several other utils for programmatically extracting information from bytecode.

> Forked from [MrLuit/evm](https://github.com/MrLuit/evm). For more info, see [Detached Fork](#detached-fork).

## Install

```sh
npm install @acuarica/evm
```

or using Yarn instead

```sh
yarn add @acuarica/evm
```

## Features

- **Converting bytecode to opcodes**
- **Reading information like events or functions from either bytecode or tx data**
- **Extracting the [swarm hash](https://github.com/ethereum/wiki/wiki/Swarm-Hash) (if any) from bytecode**
- **Checking whether an opcode exists and is reachable within bytecode**
- **Detecting whether contracts are compliant to certain ERCs**

## API &nbsp;&nbsp; [![TypeDoc](https://img.shields.io/badge/full%20reference-acuarica.github.io%2Fevm%2Ftsdoc-blueviolet?style=flat-square)](https://acuarica.github.io/evm/tsdoc)

### Main Methods and Properties

- [**`bytecode`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#bytecode) - Get raw bytecode (not really useful; same as input)
- [**`metadata`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#metadata) - Get [IPFS](https://docs.ipfs.tech/concepts/content-addressing/#cid-versions) or [Swarm](https://github.com/ethereum/wiki/wiki/Swarm-Hash) hash (if present) for [contract metadata](https://docs.soliditylang.org/en/latest/metadata.html)
- [**`evm.opcodes`**](https://acuarica.github.io/evm/tsdoc/classes/evm.EVM.html#opcodes) - Returns opcodes including pc and pushData (if included)
- [**`evm.jumpdests`**](https://acuarica.github.io/evm/tsdoc/classes/evm.EVM.html#jumpdests) - Get map of program counters from JUMPDEST opcodes
- [**`getFunctions()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#getFunctions) - Parse functions from their signatures in bytecode
- [**`getEvents()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#decompile) - Parse events from their signatures in bytecode
- [**`containsOpcode(opcode)`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#containsOpcode) - Check whether an opcode exists and is reachable within bytecode
- [**`decompile()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#decompile) - Decompile bytecode into readable [Solidity](https://soliditylang.org/)-like pseudocode
- [**`isERC165()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#isERC165) - Detect whether contract is [ERC165](https://eips.ethereum.org/EIPS/eip-165)-compliant

## Usage

### Converting Bytecode to Opcodes

**Node.js.**

```javascript
const { EVM } = require('evm');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.mycryptoapi.com/eth'));

web3.eth.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d').then(code => {
  /* CryptoKitties contract */
  const evm = new EVM(code);
  console.log(evm.getOpcodes()); /* Get opcodes */
});
```

**Browser.**

```javascript
const { EVM } = window.EVM_Utils;
const web3 = new Web3(window.web3.currentProvider);
web3.eth.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', function (err, code) {
  /* DAI contract */ if (err) throw err;
  const evm = new EVM(code);
  console.log(evm.getOpcodes()); /* Get opcodes */
});
```

### Decompiling a Contract

**Node.js.**

```javascript
const { EVM } = require('evm');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.mycryptoapi.com/eth'));

web3.eth.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d').then(code => {
  /* CryptoKitties contract */
  const evm = new EVM(code);
  console.log(evm.getFunctions()); /* Get functions */
  console.log(evm.getEvents()); /* Get events */
  console.log(evm.decompile()); /* Decompile bytecode */
  console.log(
    evm.containsOpcode('SELFDESTRUCT')
  ); /* Check whether contract contains a SELFDESTRUCT */
  console.log(evm.isERC165()); /* Detect whether contract is ERC165-compliant */
});
```

**Browser.**

```javascript
const { EVM } = window.EVM;
const web3 = new Web3(window.web3.currentProvider);
web3.eth.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', function (err, code) {
  /* DAI contract */ if (err) throw err;
  const evm = new EVM(code);
  console.log(evm.getFunctions()); /* Get functions */
  console.log(evm.getEvents()); /* Get events */
  console.log(evm.decompile()); /* Decompile bytecode */
  console.log(
    evm.containsOpcode('SELFDESTRUCT')
  ); /* Check whether contract contains a SELFDESTRUCT */
  console.log(evm.isERC165()); /* Detect whether contract is ERC165-compliant */
});
```

### Extracting data from transaction **WIP**

**Node.js.**

```javascript
const { Transaction } = require('evm');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.mycryptoapi.com/eth'));

web3.eth
  .getTransaction('0xd20a8d888a3f29471ea41ea77cc2d95ccd79ade1eaad059e83524e72b9adf962')
  .then(transactionData => {
    const transaction = new Transaction();
    transaction.setInput(transactionData.input);
    console.log(transaction.getFunction()); /* Get function */
  });
```

**Browser.**

```javascript
const { Transaction } = window.EVM;
const web3 = new Web3(window.web3.currentProvider);
web3.eth.getTransaction(
  '0xd20a8d888a3f29471ea41ea77cc2d95ccd79ade1eaad059e83524e72b9adf962',
  function (err, transactionData) {
    if (err) throw err;
    const transaction = new Transaction();
    transaction.setInput(transactionData.input);
    console.log(transaction.getFunction()); /* Get function */
  }
);
```

## Detached Fork

This GitHub repo was originally a fork of <https://github.com/MrLuit/evm>.
It served as a great starting point for this project.
The fact that it is lightweight and written in TypeScript,
make it ideal for embedding in other applications.

However, as we started to support and decompile newer contracts, we realize it was quite outdated.
Besides not being able to process newer smart contracts, for some, the bytecode analysis algorithm did not terminate.
That's the reason we forked that repo.

We did a major overhaul of the codebase, adding new features, refactoring the whole project and adding both testing and documentation.
As we added changes, we realized it did not make sense to keep it a forked repo.
Moreover, when sending new PRs, the default `base` repo is the upstream repo, which is not what we want in our case.
This behavior is both error prone and annoying.
That's why, as of _Apr 17, 2023_, this project is no longer a fork of [MrLuit/evm](https://github.com/MrLuit/evm).
