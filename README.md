# EVM-cli

[![npm (scoped)](https://img.shields.io/npm/v/@acuarica/evm-cli?style=flat-square)](https://www.npmjs.com/package/@acuarica/evm-cli)
![npm](https://img.shields.io/npm/dt/@acuarica/evm-cli)
[![GitHub](https://img.shields.io/github/license/acuarica/evm-cli?style=flat-square)](https://github.com/acuarica/evm-cli/blob/main/LICENSE)

## `--help`

<!-- BEGIN:--help -->
```sh
evmjs <cmd> [path]

Commands:
  evmjs abi [path]        Shows the ABI of the contract
  evmjs dis [path]        Disassemble the bytecode into Opcodes
  evmjs cfg [path]        Writes the cfg of the selected function in `dot`
                          format into standard output
  evmjs decompile [path]  Decompile
  evmjs console [path]    Console

Options:
      --version   Show version number                                  [boolean]
  -s, --selector  Function signature, e.g., `balanceOf(address)` or selector
                  hash to choose a specific function                    [string]
      --help      Show help                                            [boolean]

At least one command must be specified

```
<!-- END:--help -->
