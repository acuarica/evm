# EVM-cli

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
