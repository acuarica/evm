<!-- markdownlint-disable no-inline-html -->

# EVM Bytecode Decompiler

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/acuarica/evm/main.yaml?style=flat-square)](https://github.com/acuarica/evm/actions/workflows/main.yaml)
![nycrc config on GitHub](https://img.shields.io/nycrc/acuarica/evm?config=.c8rc.json&style=flat-square)
[![npm](https://img.shields.io/npm/v/sevm?style=flat-square)](https://www.npmjs.com/package/sevm)
![npm](https://img.shields.io/npm/dt/sevm?style=flat-square)
[![GitHub](https://img.shields.io/github/license/acuarica/evm?style=flat-square)](https://github.com/acuarica/evm/blob/main/LICENSE)
[![install size](https://packagephobia.com/badge?p=sevm)](https://packagephobia.com/result?p=sevm)
[![Demo](https://img.shields.io/badge/demo-acuarica.github.io%2Fevm-informational?style=flat-square)](https://acuarica.github.io/evm)

A Symbolic [Ethereum Virtual Machine (EVM)](https://medium.com/mycrypto/the-ethereum-virtual-machine-how-does-it-work-9abac2b7c9e) interpreter and decompiler, along with several other utils for programmatically extracting information from bytecode.

> [!NOTE]
> Forked from [MrLuit/evm](https://github.com/MrLuit/evm). For more info, see [Detached Fork](#detached-fork).

## Features

> :construction: Under heavy development. Feel free to open an [issue](https://github.com/acuarica/evm/issues) if something is not right. :construction:

- **Lightweight with no dependencies**
- **Embedded signature database** <small style="background: #f000b8; padding: 0.2em; border-radius: 3px">WIP</small>
- **Convert bytecode to opcodes**
- **Read information like events or functions from either bytecode or TX data**
- **Extract the [IPFS](https://docs.soliditylang.org/en/latest/metadata.html) or [swarm hash](https://github.com/ethereum/wiki/wiki/Swarm-Hash) (when present) from bytecode**
- **Check whether an opcode exists and is reachable within bytecode execution**
- **Detect whether contracts are compliant to certain ERCs**

## Install

Install using your package manager or Browser's `script` tag

<!-- tabs:start -->

### **yarn**

```sh
yarn add sevm
```

### **npm**

```sh
npm install sevm
```

or if you're interested only in the CLI tool, install globally in your system

```sh
npm install --global sevm
```

### **Browser <span class="tab-badge">WIP</span>**

```javascript
<script src="https://cdn.jsdelivr.net/gh/acuarica/evm@f88b20a/lib/EVM.js"></script>
```

<!-- tabs:end -->

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

<!-- tabs:start -->

#### **Node.js**

```js
const { EVM } = require('evm');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.mycryptoapi.com/eth'));

web3.eth.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d').then(code => {
  /* CryptoKitties contract */
  const evm = new EVM(code);
  console.log(evm.getOpcodes()); /* Get opcodes */
});
```

#### **Browser**

```js
const { EVM } = window.EVM_Utils;
const web3 = new Web3(window.web3.currentProvider);
web3.eth.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', function (err, code) {
  /* DAI contract */ if (err) throw err;
  const evm = new EVM(code);
  console.log(evm.getOpcodes()); /* Get opcodes */
});
```

<!-- tabs:end -->

### Decompiling a Contract

<!-- tabs:start -->

#### **Node.js**

```js
const { Contract } = require('evm');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.mycryptoapi.com/eth'));

web3.eth.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d').then(code => {
  /* CryptoKitties contract */
  const contract = new Contract(code);
  console.log(contract.getFunctions()); /* Get functions */
  console.log(contract.getEvents()); /* Get events */
  console.log(contract.decompile()); /* Decompile bytecode */
  console.log(
    contract.containsOpcode('SELFDESTRUCT')
  ); /* Check whether contract contains a SELFDESTRUCT */
  console.log(contract.isERC165()); /* Detect whether contract is ERC165-compliant */
});
```

#### **Browser**

```js
const { Contract } = window.EVM;
const web3 = new Web3(window.web3.currentProvider);
web3.eth.getCode('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', function (err, code) {
  /* DAI contract */ if (err) throw err;
  const contract = new Contract(code);
  console.log(contract.getFunctions()); /* Get functions */
  console.log(contract.getEvents()); /* Get events */
  console.log(contract.decompile()); /* Decompile bytecode */
  console.log(
    contract.containsOpcode('SELFDESTRUCT')
  ); /* Check whether contract contains a SELFDESTRUCT */
  console.log(contract.isERC165()); /* Detect whether contract is ERC165-compliant */
});
```

<!-- tabs:end -->

### Extracting data from transaction **WIP**

<!-- tabs:start -->

#### **Node.js**

```js
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

#### **Browser**

```js
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

<!-- tabs:end -->

## Advanced Usage

### Hooks

```js examples/Simple-Hook.mjs
import { EVM, London } from 'sevm';

// contract Test {
//     event Deposit(uint256);
//     fallback () external payable {
//         emit Deposit(tx.gasprice);
//     }
// }
const bytecode = '608060408190524581527f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e3842690602090a16040805145815290517f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e384269181900360200190a1604080513a815290517f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e384269181900360200190a100';

const evm = new EVM(bytecode, new class extends London {
    /** @override */
    GASPRICE = (/** @type {import("sevm").Operand} */ state) => {
        super.GASPRICE(state);
        console.log(state.stack.top);
    };
}());

evm.start();
```

## CLI `--help`

```console !sevm=bin/sevm.mjs --help
$ sevm --help
sevm <cmd> <contract>

Commands:
  sevm metadata <contract>  Shows the Metadata of the contract[1]
  sevm abi <contract>       Shows the ABI of the contract[2]
  sevm dis <contract>       Disassemble the bytecode into Opcodes
  sevm cfg <contract>       Writes the cfg of the selected function in `dot` for
                            mat into standard output
  sevm sol <contract>       Decompile the contract into Solidity-like source
  sevm yul <contract>       Decompile the contract into Yul-like source[3]
  sevm config               Shows cache path used to store downloaded bytecode

Options:
      --version   Show version number                                  [boolean]
      --color     Display with colors, use `--no-color` to deactivate colors
                                                       [boolean] [default: true]
  -s, --selector  Function signature, e.g., `balanceOf(address)` or selector has
                  h to choose a specific function                       [string]
      --help      Show help                                            [boolean]

Examples:
  sevm abi 0x00000000000C2E074eC69A0dFb299  shows the ABI of the ENS registry co
  7BA6C7d2e1e                               ntract
  sevm decompile 0x00000000000C2E074eC69A0  decompiles the ENS registry contract
  dFb2997BA6C7d2e1e

[1] See https://docs.soliditylang.org/en/latest/metadata.html for more informati
on regarding Metadata generated by the Solidity compiler.
[2] See https://docs.soliditylang.org/en/latest/abi-spec.html#abi-json for more
information regarding the ABI specification.
[3] See https://docs.soliditylang.org/en/latest/yul.html for more information re
garding Yul.

```

## EVM Bytecode Signature & Topic Hashes

`sevm` comes with a collection of Ethereum `function` and `event` signatures.
They are available through the `sevm/4byte` module.
It looks up in the signature and events database for matching hashes.

When a matching `function` or `event` is found in a `Contract`,
it patches the `function` or `event` with the corresponding signature.

The `sevm/4byte` is completely independent from the main module.
It is not loaded by default in the main module.
It needs to be `import`ed explicitly.
This allows the user to create a bundle without the lookup database provided thet want to use another solution.

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
