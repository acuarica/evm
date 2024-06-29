<!-- markdownlint-disable no-inline-html -->

# Symbolic EVM Bytecode Decompiler

![splash preview](./splash.png?raw=true)

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/acuarica/evm/main.yml?style=flat-square)](https://github.com/acuarica/evm/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/acuarica/evm/graph/badge.svg?token=CHCTT3ABLL)](https://codecov.io/gh/acuarica/evm)
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

- **Lightweight with no dependencies, ~65 kB minified ~17 kB minified & brotlied**
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

// WETH Contract
// https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
const bytecode = await new Provider().getCode('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

const contract = new Contract(bytecode).patchdb(); // Lookup for 4byte matches
console.log(contract.solidify()); //Decompile bytecode to Solidity
```

You can use the `contract.yul()` method to decompile the bytecode into Yul-like format.

### Detect Functions, Events and ERC compliance

```js examples/Detect-Functions-Events-ERCs.mjs
import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await new Provider().getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');

const contract = new Contract(bytecode).patchdb();
console.log('functions', contract.getFunctions());
console.log('events', contract.getEvents());
console.log('isERC 165', contract.isERC('ERC165')); /* Detect whether contract is ERC165-compliant */
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
    GASPRICE = (/** @type {import('sevm').Operand} */ state) => {
        super.GASPRICE(state);
        console.log('top', state.stack.top);
    };
}());

evm.start();
```

### Advanced Hooks

A contract might embed another contract it creates and deploys.
Using hooks you can extract the embedded contract.

```ts examples/Advanced-Hooks.ts
import { Contract, type Opcode, Shanghai, type State } from 'sevm';
import type { DataCopy, Create } from 'sevm/ast';
import 'sevm/4bytedb';

// contract Token {
//     event Deposit(uint256 value);
//     fallback() external payable {
//         emit Deposit(3);
//     }
// }
// contract Test {
//     fallback() external payable {
//         new Token();
//     }
// }
const bytecode = '6080604052604051600e90602d565b604051809103906000f0801580156029573d6000803e3d6000fd5b5050005b60918061003a8339019056fe6080604052348015600f57600080fd5b50607480601d6000396000f3fe60806040527f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e3842660036040518082815260200191505060405180910390a100fea2646970667358221220f03e9c56a5b70c1ba8fadf7d234cbca48d388951bfc7d402f0c92e4cb2afcd9f64736f6c63430007060033a264697066735822122053e5ffa19b83ac364f3adf6836d3758c98ae850b0fc9f5059124bf85d12c8d7264736f6c63430007060033';

let constructorContract: Contract, tokenContract: Contract;
const testContract = new Contract(bytecode, new class extends Shanghai {
    override CREATE = (state: State) => {
        super.CREATE(state);
        const bytecode = (state.stack.top as Create).bytecode!;

        constructorContract = new Contract(bytecode, new class extends Shanghai {
            override CODECOPY = (state: State, _opcode: Opcode, evm: { bytecode: Uint8Array }) => {
                const dest = state.stack.top?.eval();
                super.CODECOPY(state, _opcode, evm);

                if (dest?.isVal()) {
                    const m = state.memory.get(dest.val) as DataCopy;
                    tokenContract = new Contract(m.bytecode!);
                }
            };
        }());
    };
}());

console.log('// Test contract -- factory');
console.log(testContract.solidify());
console.log('// Token contract -- constructor');
console.log(constructorContract!.solidify());
console.log('// Token contract -- deployed bytecode');
console.log(tokenContract!.patchdb().solidify());
```

## CLI Tool

`sevm` comes with a CLI tool to examine bytecode from the command line.

> [!NOTE]
> The CLI tool is completely independent from the rest of the library.
> This means that if you intend to use `sevm` as part of your application as a bundle,
> you won't include the CLI tool nor any of its dependencies.

### `sevm --help`

```console !sevm=bin/sevm.mjs --help
$ sevm --help
sevm <cmd> <contract>

CLI tool to analyze EVM bytecode

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
  --color    Displays with colors, use `--no-color` to deactivate colors
                                                       [boolean] [default: true]
  --patch    Patches the Contract public functions and events with signatures fr
             om https://openchain.xyz, use `--no-patch` to skip patching
                                                       [boolean] [default: true]
  --cache    Enables cache of contracts and ABIs fetched from remote networks an
             d https://openchain.xyz respectively, use `--no-cache` to skip catc
             hing                                      [boolean] [default: true]
  --rpc-url  JSON-RPC network provider URL. Alternatively, set the env variable
             `SEVM_RPC_URL` (the flag takes precedence over the env variable)
                               [string] [default: "https://cloudflare-eth.com/"]
  --help     Show help                                                 [boolean]

Examples:
  sevm abi 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
  sevm sol 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
  sevm sol --no-patch 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
  echo 0x600160020160005500 | sevm yul -    Use `-` to read bytecode from stdin

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
  contract  Path or a Ethereum address where to locate the bytecode of the contr
            act. When `-` is used, bytecode will be read from standard input.
                                                             [string] [required]

Options:
  --version     Show version number                                    [boolean]
  --color       Displays with colors, use `--no-color` to deactivate colors
                                                       [boolean] [default: true]
  --patch       Patches the Contract public functions and events with signatures
                 from https://openchain.xyz, use `--no-patch` to skip patching
                                                       [boolean] [default: true]
  --cache       Enables cache of contracts and ABIs fetched from remote networks
                 and https://openchain.xyz respectively, use `--no-cache` to ski
                p catching                             [boolean] [default: true]
  --rpc-url     JSON-RPC network provider URL. Alternatively, set the env variab
                le `SEVM_RPC_URL` (the flag takes precedence over the env variab
                le)            [string] [default: "https://cloudflare-eth.com/"]
  --help        Show help                                              [boolean]
  --with-stack  Include the current stack next to each decoded opcode
  --with-trace  Include the trace of staments at the end of each basic block

```

## EVM Bytecode Function and Event Signature Hashes

`sevm` includes the `sevm/4byte` module to patch function and event signatures by looking up in the [OpenChain API](https://docs.openchain.xyz/#/default/get_signature_database_v1_lookup).
Alternatively, `sevm` comes with an embedded database of Ethereum `function` and `event` signature hashes,
available through the `sevm/4bytedb` module.
These modules are mutually exclusive, _i.e._, you should use either _only_ one of them.

The `sevm/4byte` and `sevm/4bytedb` modules look up in the function and events remote OpenChain and embedded database respectively for matching hashes.
When a matching `function` or `event` is found in a `Contract`,
they patch the `function` or `event` with the corresponding signature.

Both `sevm/4byte` and `sevm/4bytedb` modules are completely independent from the main module, _i.e._,
they are not loaded by default.
They need to be `import`ed explicitly.
This allows users to create a bundle without the `fetch` dependency or lookup database provided they want to use a custom solution.

## Contributing

### [`test`](./test/)

Tests run using _Mocha_ and can be executed with

```console
yarn test
```

Each top-level test name begins with `::` so it is easier to filter out tests (using _Mocha_'s `-f/--fgrep` or `-g/--grep` flags).
For example, to run _only_ tests for the `step` module use

```console
yarn test -g ::step
```

#### [`solc` compiler](./test/utils/solc.ts)

The [`solc-js`](https://github.com/ethereum/solc-js) compiler is used to compile Solidity contracts used throughout the test suite.
The [`./test/utils/solc.ts`](./test/utils/solc.ts) wrapper loads the indicated `solc-js` version.

To avoid re-compiling the same contract, and enable faster test times,
compilation output is cached in the `.artifacts/` folder.
Compilation output is stored by version, _e.g._, contracts compiled with `solc-0.8.21` will be stored in `.artifacts/v0.8.21`.

Whenever there is cache match, _i.e._, the contract does not need compilation, the prefix of the MD5 hash of the compilation input is appended at the end of the test title

```out
    ✔ should find '0x00000000' method selector decoded as `ISZERO` #318d1e
```

However, if the contract in the test case needs to be compiled,
the icon `🛠️` will be appended to the end of the test title

```out
    ✔ should find '0x00000000' method selector decoded as `ISZERO` #318d1e 🛠️
```

But if the compiler has not already been loaded (by a previous test case),
the test title will have the version appended at the end of its title.
For example

```out
    ✔ should not accept `PUSH0` as a valid opcode in Paris fork #97d6ca 🛠️--loads `solc-0.8.21` (307ms)
```

#### [`__snapshots__`](./test/__snapshots__/)

To ensure the test output does not change unexpectedly,
we use an ad-hoc snapshot testing solution similar to [_Jest_'s](https://jestjs.io/docs/snapshot-testing).
The snapshots are stored in [`test/__snapshots__`](./test/__snapshots__/).

> The [`.gitattributes`](./.gitattributes) file normalizes snapshot file endings,
so that snapshot tests run properly on both Unix-like and Windows OSes.
This is especially important for running snapshot tests in GitHub Actions.

To re-generate the snapshot artifacts in a test after an intentional implementation change,
set the environment variable `UPDATE_SNAPSHOTS=1`.
For example

```console
UPDATE_SNAPSHOTS=1 yarn test -g ::mainnet
```

> [!TIP]
> It is usually better to filter (`-f`/`-g` flags) which snapshot test cases
> get re-generated to avoid any unwanted unintentional updates.

When a test is creating or re-generating a snapshot,
the indicator icon `📸` is appended to the test title.
For example

```out
        ✔ should match Solidity snapshot 📸
```

On the other hand, when a test is comparing against a previously created snapshot,
the indicator icon `🎞️` is appended to the test title.
For example

```out
        ✔ should match Solidity snapshot 🎞️
```

#### [`4byte.test.ts`](./test/4byte.test.ts)

This test needs to be manually enabled because it depends on a network connection (to query the [OpenChain API](https://docs.openchain.xyz/#/default/get_signature_database_v1_lookup) to look for method signatures).

Set the environment variable `ENABLE_4BYTE_TEST=1` to enable this test.
When executing it, you may want to run _only_ this test, for example

```console
ENABLE_4BYTE_TEST=1 yarn test -g ::4byte
```

#### [`dataset.test.ts`](./test/dataset.test.ts)

> [!IMPORTANT]
> Make sure the [`.dataset`](#dataset) folder is checked out before running this test.

This test is optional.
It needs to be manually enabled because its take longer than the rest of test suite to run.
It is not ergonomic to include it in the main test suite.

Set the environment variable `ENABLE_DATASET_TEST=1` to enable this test.
When executing it, you may want to run _only_ this test, for example

```console
ENABLE_DATASET_TEST=1 yarn test -g ::dataset
```

#### [`examples.test.ts`](./test/examples.test.ts)

This test needs to be manually enabled because it depends on a network connection (to fetch code from a live network).

Set the environment variable `ENABLE_EXAMPLES_TEST=1` to enable this test.
When executing it, you may want to run _only_ this test, for example

```console
ENABLE_EXAMPLES_TEST=1 yarn test -g ::examples
```

#### Coverage

Run tests with coverage with

```console
yarn coverage
```

Coverage reports are uploaded to Codecov

[![codecov Sunburst](https://codecov.io/gh/acuarica/evm/graphs/sunburst.svg?token=CHCTT3ABLL)](https://codecov.io/gh/acuarica/evm)

### [`types`](./types/)

This folder contains _vendor_ types to refine or declare types of libraries.
It is used either in tests or internally in the library, _i.e._, these types are not re-exported and hence not part of the public library API.

### [`scripts`](./scripts/)

Contains utility scripts that automates the development process.

- [`4bytedb.mjs`](./scripts/4bytedb.mjs) Generates function and events lookup tables database in `json` format.
- [`ercs.mjs`](./scripts/ercs.mjs) Generates ERCs function and event definitions from [`scripts/ercs.sol`](./scripts/ercs.sol).
- [`help.mjs`](./scripts/help.mjs) Embeds [`examples`](#examples) and `sevm --help` into [`README`](./README.md)
- [`solc.mjs`](./scripts/solc.mjs) Downloads and caches [`solc-js`](https://github.com/ethereum/solc-js) compilers used in tests. It is invoked via Mocha's [_Global Setup Fixtures_](https://mochajs.org/#global-setup-fixtures).

### [`examples`](./examples/)

The [`examples`](./examples/) folder contains code examples that showcase `sevm` features.
These code examples are the ones embedded in this document.

To ensure these examples don't get outdated,
[`test/examples.test.ts`](#examplestestts) runs every example script in the `examples` folder to verify they are compiled and executed properly.
Moreover, their output is recorded into [`test/__snapshots__/examples.snap.md`](./test/__snapshots__/examples.snap.md) and compared against in subsequent tests.

### [`.dataset`](./.dataset/)

This folder contains a [dataset](https://github.com/acuarica/contract-dataset) of contract bytecodes deployed in a public network.

It is attached as a Git submodule.
To check out the `.dataset` folder, `clone` this repo using the [`--recursive` option](https://git-scm.com/docs/git-clone#Documentation/git-clone.txt---recurse-submodulesltpathspecgt),
which clones the repo and the `.dataset` submodule all at once.

```console
git clone --recursive https://github.com/acuarica/evm.git
```

Alternatively, if you have already cloned the repo, run the following to check out the `.dataset` folder

```console
git submodule update --init
```

The contract bytecodes dataset is used in [`test/dataset.test.ts`](#datasettestts), which loads every contract bytecode and runs the Solidity and Yul decompilation.
This ensures that the analysis works on _real_ contracts and that is does not enter into an infinite loop while interpreting a bytecode cycle.

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
