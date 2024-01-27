# Internals

## Detection of Function Selectors

The first four bytes of the call data for a function call specifies the function to be called.
See <https://docs.soliditylang.org/en/latest/abi-spec.html#function-selector> for more details.
In Yul it is represented as `calldataload(0x0)` and some additional machinery is needed to get only the first four bytes.

Once the first four bytes are obtained,
the function selector is compared against each method's function selector to decide which branch to jump to.

### Solidity

**latest version**.

Solidity uses the following schema to mask the function selector

```yul
eq(shr(calldataload(0x0), 0xe0), 0x01234567)
```

If this condition evaluates to `1`, then the program counter jumps to the beginning of the contract's method indicated by the function selector.

There is a special case when the contract is compiled with optimizations enabled and the contract selector to match is `0x00000000`.
In this case, instead of using the schema described above it uses a simple comparison

```yul
iszero(shr(calldataload(0x0), 0xe0))
```

**<v0.5.5**.

In Solidity versions older than [`0.5.5`](https://soliditylang.org/blog/2019/03/05/solidity-0.5.5-release-announcement/) however the following schema was used

```yul
eq(div(calldataload(0x0), exp(0x2, 0xe0)), 0x01234567)
```

This was because [bitwise shifting instructions in the EVM](https://eips.ethereum.org/EIPS/eip-145) were introduced as part of the [Constantinople Hardfork](https://eips.ethereum.org/EIPS/eip-1013).

### Vyper

Instead of masking `calldataload(0x0)`, [Vyper](https://docs.vyperlang.org/en/stable/) uses a different strategy to obtain the function selector.
It loads `calldataload(0x0)` carefully into memory such that afterwards a simple `mload(0x0)` can retrieve the function selector.
It achieve this goal in two similar ways.
The first one using `MSTORE` in the following sequence of mnemonics

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

**vyper:0.2.15**.

<https://etherscan.io/address/0x9B12C90BAd388B7e417271eb20678D1a7759507c#code>

```yul
iszero(eq(mload(0x0), 0xbbf7408a))`
```

fall-through

```txt
28  PUSH4 0xbbf7408a    〒 0xbbf7408a|mload(0x0)
33  DUP2                〒 local0|0xbbf7408a|local0
34  EQ                  〒 eq(local0, 0xbbf7408a)|local0
35  ISZERO              〒 iszero(eq(local0, 0xbbf7408a))|local0
36  PUSH2   0x00cd      〒 [J]0xcd|iszero(eq(local0, 0xbbf7408a))|local0
39  JUMPI               〒 local0
```

**vyper:0.3.3**.

<https://etherscan.io/address/0xa2E88993a0f0dc6e6020431477f3A70c86109bBf#code>

```yul
xor(shr(calldataload(0x0), 0xe0), 0xa2114cdb)
```

fall-through

```txt
25  PUSH4 0xa2114cdb    〒 0xa2114cdb|shr(calldataload(0x0), 0xe0)
30  DUP2                〒 local0|0xa2114cdb|local0
31  XOR                 〒 xor(local0, 0xa2114cdb)|local0
32  PUSH2 0x002d        〒 [J]0x2d|xor(local0, 0xa2114cdb)|local0
35  JUMPI               〒 local0
```
