# Internals

In this document we describe how compilers emit EVM bytecode in certain situations.
This helps understand the specific patterns `sevm` needs to look for.

## Detection of Function Selectors

The first four bytes of the call data for a function call specifies the function to be called.
See <https://docs.soliditylang.org/en/latest/abi-spec.html#function-selector> for more details.

It is represented as `calldataload(0x0)` (using [Yul](https://docs.soliditylang.org/en/latest/yul.html) syntax). Some additional machinery is needed to get only the first four bytes.
Once the first four bytes are obtained,
the function selector is compared against each method's function selectors to decide which branch to take to continue the bytecode execution.

### Solidity

**latest version**.

Solidity uses the following schema to mask the function selector

```yul
eq(shr(calldataload(0x0), 0xe0), 0x01234567)
```

If this condition evaluates to `1`, then the program counter jumps to the beginning of the contract's method indicated by the function selector.
This is the most used current vast majority of contracts are deployed using this schema to dispatch the contract's selected method.

There is a special case when the contract is compiled with optimizations enabled and the contract selector to match is `0x00000000`.
In this case, instead of using the schema described above it uses the `iszero` instruction

```yul
iszero(shr(calldataload(0x0), 0xe0))
```

However, when the bytecode is placed in a way that it is better to take the fall-through branch (the function gets selected when this condition is `false`),
the following schema is used

```yul
sub(0x01234567, shr(calldataload(0x0), 0xe0))
```

_see for example <https://etherscan.io/address/0x13df570de8465f5319b6a2c60de21716400074e7#code>_

**<v0.5.5**.

In Solidity versions older than [`0.5.5`](https://soliditylang.org/blog/2019/03/05/solidity-0.5.5-release-announcement/) however the following schema was used

```yul
eq(div(calldataload(0x0), exp(0x2, 0xe0)), 0x01234567)
```

This was because [bitwise shifting instructions in the EVM](https://eips.ethereum.org/EIPS/eip-145) were introduced as part of the [Constantinople Hardfork](https://eips.ethereum.org/EIPS/eip-1013).

### Vyper

Instead of masking `calldataload(0x0)`, [Vyper](https://docs.vyperlang.org/en/stable/) uses a different strategy to obtain the function selector.
It loads `calldataload(0x0)` carefully into memory such that afterwards a simple `mload(0x0)` can retrieve the function selector.
It achieves this goal in two similar ways.
The first one is using `MSTORE` in the following sequence of mnemonics

```mnemonic
PUSH0
CALLDATALOAD
PUSH1 0x1c
MSTORE
```

_see it in action in [evm.codes](https://www.evm.codes/playground?fork=shanghai&unit=Wei&callData=0x01234567&codeType=Mnemonic&code='PUSH0~CALLDATALOAD~PUSH1%200x1c~MSTORE~~'~%5Cn%01~_)_

The location `0x1c` makes `calldataload(0x0)` to be placed in last four bytes of the first memory word.
Given that this bytecode is placed at the beginning of the contract,
the rest of the memory is empty thus returning `0`s.
A later `mload(0x0)` pushes onto the stack the first memory word,
effectively returning `calldataload(0x0)`.

The second one is using `CALLDATACOPY` to achieve the same result

```mnemonic
PUSH1 0x04
PUSH1 0x00
PUSH1 0x1c
CALLDATACOPY
```

_see it in actions in [evm.codes](https://www.evm.codes/playground?fork=shanghai&unit=Wei&callData=0x01234567&codeType=Mnemonic&code='~04z~00z~1czCALLDATACOPYz'~PUSH1%200xz%5Cn%01z~_)_

> **The list of Vyper versions below is not exhaustive.**
> **It is based solely on contracts deployed on Ethereum mainnet.**

**vyper:0.3.3**.

It uses the following pattern taking the fall-through branch when the function selector matches the call data

```yul
xor(shr(calldataload(0x0), 0xe0), 0x01234567)
```

> Note that the function selector is obtained by masking `calldataload(0x0)` and not from memory using `mload(0x0)`.

_see for example <https://etherscan.io/address/0xa2E88993a0f0dc6e6020431477f3A70c86109bBf#code>_

**vyper:0.3.1**.

It uses the following pattern taking the fall-through branch when the function selector matches the call data

```yul
xor(mload(0x0), 0x01234567)
```

_see for example <https://etherscan.io/address/0x28ED637C5e3371c2678C2d346dF04Fb634ED832d#code>_

**vyper:0.2.15**.

It uses the following pattern taking the fall-through branch when the function selector matches the call data

```yul
iszero(eq(mload(0x0), 0x01234567))`
```

_see for example <https://etherscan.io/address/0x9B12C90BAd388B7e417271eb20678D1a7759507c#code>_
