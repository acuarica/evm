# Internals

## Detection of Function Selectors

### Solidity

### Vyper

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
