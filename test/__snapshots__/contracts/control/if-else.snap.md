# contracts/control/if-else

```solidity -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmSK1gqLPM6JZDei7kNjcpHtiWDUhGpizXC3UD7Py7PiXQ
pragma solidity 0.7.6;

contract Contract {

    unknown var1__1; // Slot #0

    fallback() external payable {
        if (block.number != 0x7 == 0) {
            undefined local0 = 0x3; // #refs 1
            var_1 = local0;
            return;
        }
        undefined local0 = 0x5; // #refs 1
        var_1 = local0;
        return;
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        if (iszero(iszero(eq(number(), 0x7)))) {
            let local0 := 0x3 // #refs 1
            sstore(0x0, local0)
            stop()
        }
        let local0 := 0x5 // #refs 1
        sstore(0x0, local0)
        stop()

    }
}

```

```mermaid -no-opt
---
title: if-else-no-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|0x0
memory[0x40] = 0x80;
when block.number != 0x7 goto 22 or fall 15
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_15 ["pc @15"]
    s_1("pc @15 (#s_1)
=|0x3
goto :[J]0x1b branch:27
")
    class s_1 state
  end
  subgraph cluster_27 ["pc @27"]
    s_2("pc @27 (#s_2)
=|
undefined local0 = 0x3; // #refs 1
var_1 = local0;
return;
")
    class s_2 state
    s_4("pc @27 (#s_4)
=|
undefined local0 = 0x5; // #refs 1
var_1 = local0;
return;
")
    class s_4 state
  end
  subgraph cluster_22 ["pc @22"]
    s_3("pc @22 (#s_3)
=|0x5
fall: 27:
")
    class s_3 state
  end
  s_0 == jumpi0_0 ==> s_3;
  s_0 -- fall --> s_1;
  s_1 == jump1_1 ==> s_2;
  s_3 -- jumpdest --> s_4;

```

```errors -no-opt
[]
```

```solidity -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmfDLKLryZvxaZrwkDPTiRrvukfFKF88ir6f2YXbrGbexw
pragma solidity 0.7.6;

contract Contract {

    uint256 var1__1; // Slot #0

    fallback() external payable {
        if (0x7 != block.number == 0) {
            var_1 = 0x3;
            return;
        }
        var_1 = 0x5;
        return;
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        if (iszero(iszero(eq(0x7, number())))) {
            sstore(0x0, 0x3)
            stop()
        }
        sstore(0x0, 0x5)
        stop()

    }
}

```

```mermaid -opt
---
title: if-else-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|0x0
memory[0x40] = 0x80;
when 0x7 != block.number goto 21 or fall 15
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_15 ["pc @15"]
    s_1("pc @15 (#s_1)
=|0x3
goto :[J]0x19 branch:25
")
    class s_1 state
  end
  subgraph cluster_25 ["pc @25"]
    s_2("pc @25 (#s_2)
=|
var_1 = 0x3;
return;
")
    class s_2 state
    s_4("pc @25 (#s_4)
=|
var_1 = 0x5;
return;
")
    class s_4 state
  end
  subgraph cluster_21 ["pc @21"]
    s_3("pc @21 (#s_3)
=|0x5
fall: 25:
")
    class s_3 state
  end
  s_0 == jumpi0_0 ==> s_3;
  s_0 -- fall --> s_1;
  s_1 == jump1_1 ==> s_2;
  s_3 -- jumpdest --> s_4;

```

```errors -opt
[]
```
