<!-- markdownlint-disable no-inline-html -->

# Symbolic EVM Bytecode Decompiler

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

- **Lightweight with virtually no dependencies, only 59kb minified**
- [**Embedded functions and events signature database**](#evm-bytecode-function-and-event-signature-hashes) <small style="background: #f000b8; padding: 0.2em; border-radius: 3px">optional</small>
- **Convert bytecode to opcodes**
- **Extract events or functions information from bytecode**
- **Extract the [IPFS](https://docs.soliditylang.org/en/latest/metadata.html) or [swarm hash](https://github.com/ethereum/wiki/wiki/Swarm-Hash) (when present) from bytecode using [`cbor-js`](https://www.npmjs.com/package/cbor-js)**
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

### **Browser**

```js
<script src="https://cdn.jsdelivr.net/npm/sevm@0.6/dist/sevm.js"></script>
```

<!-- tabs:end -->

or if you're interested only in the [CLI Tool](#cli-tool), install globally in your system

```sh
npm install --global sevm
```

`sevm` supports both ESM `import` and Node's CommonJS `require`.
Also it can be used in browsers, where all classes and functions can be found under the `sevm` global object.

<!-- tabs:start -->

### **ESM**

```js examples/Use-with-Import.mjs
import { Contract } from 'sevm';

// 00 opcode is STOP https://www.evm.codes/#00?fork=shanghai
const contract = new Contract('0x00');
console.log(contract.solidify());
```

### **CJS**

```js examples/Use-with-Require.js
const { Contract } = require('sevm');

// 00 opcode is STOP https://www.evm.codes/#00?fork=shanghai
const contract = new Contract('0x00');
console.log(contract.solidify());
```

### **`script` tag**

```js
<script src="https://cdn.jsdelivr.net/npm/sevm@0.6/dist/sevm.js"></script>

<script>
  console.log('sevm exported symbols', sevm);

  // 00 opcode is STOP https://www.evm.codes/#00?fork=shanghai
  const contract = new sevm.Contract('0x00');
  document.getElementById('code').innerHTML = contract.solidify();
</script>
```

<!-- tabs:end -->

## API &nbsp;&nbsp; [![TypeDoc](https://img.shields.io/badge/full%20reference-acuarica.github.io%2Fevm%2Ftsdoc-blueviolet?style=flat-square)](https://acuarica.github.io/evm/tsdoc)

### Main Methods and Properties

- [**`bytecode`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#bytecode) - Get raw bytecode (not really useful; same as input)
- [**`metadata`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#metadata) - Get [IPFS](https://docs.ipfs.tech/concepts/content-addressing/#cid-versions) or [Swarm](https://github.com/ethereum/wiki/wiki/Swarm-Hash) hash (if present) for [contract metadata](https://docs.soliditylang.org/en/latest/metadata.html)
- [**`opcodes`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#opcodes) - Returns opcodes reachable within bytecode
- [**`getFunctions()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#getFunctions) - Parse functions from their signatures in bytecode
- [**`getEvents()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#decompile) - Parse events from their signatures in bytecode
- [**`solidify()`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#solidify) - Decompile bytecode into readable [Solidity](https://soliditylang.org/)-like pseudocode
- [**`isERC(ercid)`**](https://acuarica.github.io/evm/tsdoc/classes/index.Contract.html#isERC) - Detect whether contract is ERC id compliant

## Usage

These examples use the `import` syntax and [`ethers.js`](https://docs.ethers.org/v6/) is used to fetch bytecode from public EVM-based networks.

### Decode Bytecode into Opcodes

```js examples/Decode-Bytecode-into-Opcodes.mjs
import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';

// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await new Provider().getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');
const contract = new Contract(bytecode);
const opcodes = contract.opcodes();
console.log(opcodes.map(opcode => opcode.format()));
```

### Decompile a Contract

```js examples/Decompile-a-Contract.mjs
import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

// Compound Contract
// https://etherscan.io/address/0x3FDA67f7583380E67ef93072294a7fAc882FD7E7#code
const bytecode = await new Provider().getCode('0x3FDA67f7583380E67ef93072294a7fAc882FD7E7');

const contract = new Contract(bytecode).patchdb(); // Lookup for 4byte matches
console.log(contract.solidify()); //Decompile bytecode to Solidity
```

### Detect Functions, Events and ERC compliance

```js examples/Detect-Functions-Events-ERCs.mjs
import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await new Provider().getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');

const contract = new Contract(bytecode).patchdb();
console.log(contract.getFunctions());
console.log(contract.getEvents());
console.log(contract.isERC('ERC165')); /* Detect whether contract is ERC165-compliant */
```

### Extract Contract Metadata

```js examples/Extract-Contract-Metadata.mjs
import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';

// USDC Token Proxy on Avalanche Testnet
// https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65#code
const provider = new JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
const bytecode = await provider.getCode('0x5425890298aed601595a70AB815c96711a31Bc65');

const contract = new Contract(bytecode);
console.log(contract.metadata);
```

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

## CLI Tool

`sevm` comes with a CLI tool to examine bytecode from the command line.

### `sevm --help`

```console !sevm=bin/sevm.mjs --help
$ sevm --help
sevm <cmd> <contract>

Commands:
  sevm metadata <contract>   Shows the Metadata of the contract[1]
  sevm abi <contract>        Shows the ABI of the contract[2]
  sevm selectors <contract>  Shows the function selectors of the contract[3]
  sevm dis <contract>        Disassemble the bytecode into Opcodes
  sevm cfg <contract>        Writes the cfg of the selected function in `dot` fo
                             rmat into standard output
  sevm sol <contract>        Decompile the contract into Solidity-like source
  sevm yul <contract>        Decompile the contract into Yul-like source[4]
  sevm config                Shows cache path used to store downloaded bytecode

Options:
  --version  Show version number                                       [boolean]
  --color    Display with colors, use `--no-color` to deactivate colors
                                                       [boolean] [default: true]
  --help     Show help                                                 [boolean]

Examples:
  sevm abi 0x00000000000C2E074eC69A0dFb299  shows the ABI of the ENS registry co
  7BA6C7d2e1e                               ntract
  sevm decompile 0x00000000000C2E074eC69A0  decompiles the ENS registry contract
  dFb2997BA6C7d2e1e

[1] See https://docs.soliditylang.org/en/latest/metadata.html for more informati
on regarding Metadata generated by the Solidity compiler.
[2] See https://docs.soliditylang.org/en/latest/abi-spec.html#abi-json for more
information regarding the ABI specification.
[3] See https://docs.soliditylang.org/en/latest/abi-spec.html#function-selector
for more information regarding Function Selectors
[4] See https://docs.soliditylang.org/en/latest/yul.html for more information re
garding Yul.

```

### `dis`

```console !sevm=bin/sevm.mjs dis --help
$ sevm dis --help
sevm dis <contract>

Disassemble the bytecode into Opcodes

Positionals:
  contract  path or address where to locate the bytecode of the contract
                                                             [string] [required]

Options:
  --version     Show version number                                    [boolean]
  --color       Display with colors, use `--no-color` to deactivate colors
                                                       [boolean] [default: true]
  --help        Show help                                              [boolean]
  --with-stack  Include the current stack next to each decoded opcode
  --with-trace  Include the trace of staments at the end of each basic block

```

## EVM Bytecode Function and Event Signature Hashes

`sevm` comes with a collection of Ethereum `function` and `event` signature hashes.
They are available through the `sevm/4byte` module.
It looks up in the signature and events database for matching hashes.

When a matching `function` or `event` is found in a `Contract`,
it patches the `function` or `event` with the corresponding signature.

The `sevm/4byte` is completely independent from the main module.
It is not loaded by default in the main module.
It needs to be `import`ed explicitly.
This allows the user to create a bundle without the lookup database provided thet want to use another solution.

## Contributing

### `scripts`

- `4byte.mjs` Generates function and events lookup tables
- `ercs.mjs` Generates ERCs function and event definitions from `ercs.sol`
- `help.mjs` Embeds examples and `sevm --help` into `README`
- `solc.mjs` Downloads and caches `solc` compilers used in tests

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
