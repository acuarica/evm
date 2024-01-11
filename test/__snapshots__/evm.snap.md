# ::evm

```yul log/decompile-known-and-unknown-events-with-locals
mstore(0x40, 0x80)
let local0 = mload(0x40) // #refs 0
let local1 = 0x1 // #refs -1
mstore(local0, local1)
let local2 = mload(0x40) // #refs 0
log1(local2, sub(add(0x20, local0), local2), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
let local3 = mload(0x40) // #refs 0
let local4 = 0x2 // #refs -1
mstore(local3, local4)
let local5 = 0x3 // #refs -1
let local6 = add(0x20, local3) // #refs -1
mstore(local6, local5)
let local7 = 0x4 // #refs -1
let local8 = add(0x20, local6) // #refs -1
mstore(local8, local7)
let local9 = mload(0x40) // #refs 0
log1(local9, sub(add(0x20, local8), local9), 0xffe66c28c1e8f8dbcfd2dcee650e27083b343af6448c70172784943f47cdbc12)
let local10 = number() // #refs 1
let local11 = mload(0x40) // #refs 0
mstore(local11, local10)
let local12 = mload(0x40) // #refs 0
log1(local12, sub(add(0x20, local11), local12), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
let local13 = mload(0x40) // #refs 0
let local14 = add(local10, 0x7) // #refs -1
mstore(local13, local14)
let local15 = mload(0x40) // #refs 0
log1(local15, sub(add(0x20, local13), local15), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
stop()

```
