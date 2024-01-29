# contracts/control/modifier

```solidity -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmWPVs1yTEnM4zG71Vr8UGoCHvM6pm9QH3q9ECYzc75gTX
pragma solidity 0.7.6;

contract Contract {

    unknown var1__1; // Slot #0
    unknown var2__2; // Slot #1

    fallback() external payable {
        require(msg.value == 0);
        if ((msg.data.length < 0x4) == 0) {
            undefined local1 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 083c7624) {
                $083c7624();
            } else {
                if (msg.sig == d07c4b2d) {
                    $d07c4b2d();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function 083c7624() public {
        undefined local2 = 0x4; // #refs 3
        require((msg.data.length - local2 < 0x20) == 0);
        var_1 = msg.data[local2] + 0x1;
        return;
    }

    function d07c4b2d() public {
        undefined local2 = 0x4; // #refs 3
        require((msg.data.length - local2 < 0x20) == 0);
        require((0xffffffffffffffffffffffffffffffffffffffff & 0xffffffffffffffffffffffffffffffffffffffff & var_2 / 0x100 ** 0x0) == (0xffffffffffffffffffffffffffffffffffffffff & msg.sender), "Ownable: caller is not the owner");
        var_1 = msg.data[local2] + 0x3;
        return;
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 := callvalue() // #refs 0
        require(iszero(local0))
        if (iszero(lt(calldatasize(), 0x4))) {
            let local1 := shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 083c7624)) {
                $083c7624();
            } else {
                if (eq(msg.sig, d07c4b2d)) {
                    $d07c4b2d();
                } else {
                    let local2 := 0x0 // #refs 0
                    revert(local2, local2)
                }
            }
        }
        let local1 := 0x0 // #refs 0
        revert(local1, local1)

        function __$083c7624(/*unknown*/) { // public
            let local2 := 0x4 // #refs 3
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x20)))
            let local4 := calldataload(local2) // #refs 0
            let local5 := add(local4, 0x1) // #refs 0
            sstore(0x0, local5)
            stop()
        }

        function __$d07c4b2d(/*unknown*/) { // public
            let local2 := 0x4 // #refs 3
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x20)))
            require(eq(and(0xffffffffffffffffffffffffffffffffffffffff, and(0xffffffffffffffffffffffffffffffffffffffff, div(sload(0x1), exp(0x100, 0x0)))), and(0xffffffffffffffffffffffffffffffffffffffff, caller())), 0x8c379a000000000000000000000000000000000000000000000000000000000, 0x20, 0x20, 0x4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572)
            let local4 := calldataload(local2) // #refs 0
            let local5 := add(local4, 0x3) // #refs 0
            sstore(0x0, local5)
            stop()
        }

    }
}

```

```mermaid -no-opt
---
title: modifier-no-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|local0
memory[0x40] = 0x80;
undefined local0 = msg.value; // #refs 0
when msg.value == 0 goto 16 or fall 12
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_12 ["pc @12"]
    s_1("pc @12 (#s_1)
=|local0
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_1 state
  end
  subgraph cluster_16 ["pc @16"]
    s_2("pc @16 (#s_2)
=|
when msg.data.length < 0x4 goto 54 or fall 26
")
    class s_2 state
  end
  subgraph cluster_26 ["pc @26"]
    s_3("pc @26 (#s_3)
=|local1
undefined local1 = msg.data >>> 0xe0; // #refs 1
case when msg.sig == 083c7624 goto [J]0x3b or fall 43
")
    class s_3 state
  end
  subgraph cluster_43 ["pc @43"]
    s_4("pc @43 (#s_4)
=|local1
case when msg.sig == d07c4b2d goto [J]0x69 or fall 54
")
    class s_4 state
  end
  subgraph cluster_54 ["pc @54"]
    s_5("pc @54 (#s_5)
=|local1
undefined local2 = 0x0; // #refs 0
revert();
")
    class s_5 state
    s_6("pc @54 (#s_6)
=|
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_6 state
  end
  subgraph cluster_59 ["pc @59"]
    s_7[["pc @59 (#s_7)
=|local3|local2|[J]0x67|local1
undefined local2 = 0x4; // #refs 3
undefined local3 = msg.data.length - local2; // #refs 0
when (msg.data.length - local2 < 0x20) == 0 goto 81 or fall 77
"]]
    class s_7 state
    style s_7 fill:#5F021F
  end
  subgraph cluster_77 ["pc @77"]
    s_8("pc @77 (#s_8)
=|local3|local2|[J]0x67|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_8 state
  end
  subgraph cluster_81 ["pc @81"]
    s_9("pc @81 (#s_9)
=|calldataload(local2)|[J]0x67|local1
goto :[J]0x97 branch:151
")
    class s_9 state
  end
  subgraph cluster_151 ["pc @151"]
    s_10("pc @151 (#s_10)
=|local1
undefined local4 = msg.data[local2]; // #refs 0
undefined local5 = msg.data[local2] + 0x1; // #refs 0
var_1 = msg.data[local2] + 0x1;
goto :[J]0x67 branch:103
")
    class s_10 state
  end
  subgraph cluster_103 ["pc @103"]
    s_11("pc @103 (#s_11)
=|local1
return;
")
    class s_11 state
  end
  subgraph cluster_105 ["pc @105"]
    s_12[["pc @105 (#s_12)
=|local3|local2|[J]0x95|local1
undefined local2 = 0x4; // #refs 3
undefined local3 = msg.data.length - local2; // #refs 0
when (msg.data.length - local2 < 0x20) == 0 goto 127 or fall 123
"]]
    class s_12 state
    style s_12 fill:#5F021F
  end
  subgraph cluster_123 ["pc @123"]
    s_13("pc @123 (#s_13)
=|local3|local2|[J]0x95|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_13 state
  end
  subgraph cluster_127 ["pc @127"]
    s_14("pc @127 (#s_14)
=|calldataload(local2)|[J]0x95|local1
goto :[J]0xa4 branch:164
")
    class s_14 state
  end
  subgraph cluster_164 ["pc @164"]
    s_15("pc @164 (#s_15)
=|[J]0xac|calldataload(local2)|[J]0x95|local1
goto :[J]0x17b branch:379
")
    class s_15 state
  end
  subgraph cluster_379 ["pc @379"]
    s_16("pc @379 (#s_16)
=|caller()|calldataload(local2)|[J]0x95|local1
goto :[J]0xac branch:172
")
    class s_16 state
  end
  subgraph cluster_172 ["pc @172"]
    s_17("pc @172 (#s_17)
=|calldataload(local2)|[J]0x95|local1
when (0xffffffffffffffffffffffffffffffffffffffff & 0xffffffffffffffffffffffffffffffffffffffff & var_2 / 0x100 ** 0x0) == (0xffffffffffffffffffffffffffffffffffffffff & msg.sender) goto 366 or fall 257
")
    class s_17 state
  end
  subgraph cluster_257 ["pc @257"]
    s_18("pc @257 (#s_18)
=|calldataload(local2)|[J]0x95|local1
undefined local4 = memory[0x40]; // #refs -1
memory[memory[0x40]] = 0x8c379a000000000000000000000000000000000000000000000000000000000;
undefined local5 = 0x4 + memory[0x40]; // #refs 2
undefined local6 = 0x20 + local5; // #refs 0
memory[local5] = 0x20 + local5 - local5;
memory[0x20 + local5] = 0x20;
undefined local7 = 0x20 + 0x20 + local5; // #refs 0
memory[0x20 + 0x20 + local5] = 0x4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572;
undefined local8 = memory[0x40]; // #refs 0
revert("Ownable: caller is not the owner");
")
    class s_18 state
  end
  subgraph cluster_366 ["pc @366"]
    s_19("pc @366 (#s_19)
=|local1
undefined local4 = msg.data[local2]; // #refs 0
undefined local5 = msg.data[local2] + 0x3; // #refs 0
var_1 = msg.data[local2] + 0x3;
goto :[J]0x95 branch:149
")
    class s_19 state
  end
  subgraph cluster_149 ["pc @149"]
    s_20("pc @149 (#s_20)
=|local1
return;
")
    class s_20 state
  end
  s_0 == jumpi0_0 ==> s_2;
  s_0 -- fall --> s_1;
  s_2 == jumpi2_2 ==> s_6;
  s_2 -- fall --> s_3;
  s_3 -- fall --> s_4;
  s_4 -- fall --> s_5;
  s_7 == jumpi7_7 ==> s_9;
  s_7 -- fall --> s_8;
  s_9 == jump9_9 ==> s_10;
  s_10 == jump7_10 ==> s_11;
  s_7 -...- s_10;
  s_12 == jumpi12_12 ==> s_14;
  s_12 -- fall --> s_13;
  s_14 == jump14_14 ==> s_15;
  s_15 == jump15_15 ==> s_16;
  s_16 == jump15_16 ==> s_17;
  s_15 -...- s_16;
  s_17 == jumpi17_17 ==> s_19;
  s_17 -- fall --> s_18;
  s_19 == jump12_19 ==> s_20;
  s_12 -...- s_19;

```

```errors -no-opt
[]
```

```solidity -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmRKAzwGxrFinRWByDxA5J9GkjGMx9ppfRfHwSiEphywRQ
pragma solidity 0.7.6;

contract Contract {

    unknown var1__1; // Slot #0
    unknown var2__2; // Slot #1

    fallback() external payable {
        require(msg.value == 0);
        if ((msg.data.length < 0x4) == 0) {
            undefined local1 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 083c7624) {
                $083c7624();
            } else {
                if (msg.sig == d07c4b2d) {
                    $d07c4b2d();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function 083c7624() public {
        require((msg.data.length - 0x4 < 0x20) == 0);
        var_1 = 0x1 + msg.data[0x4];
        return;
    }

    function d07c4b2d() public {
        require((msg.data.length - 0x4 < 0x20) == 0);
        require((msg.sender & (0x1 << 0xa0) - 0x1) == ((0x1 << 0xa0) - 0x1 & var_2), "Ownable: caller is not the owner");
        var_1 = 0x3 + msg.data[0x4];
        return;
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 := callvalue() // #refs 0
        require(iszero(local0))
        if (iszero(lt(calldatasize(), 0x4))) {
            let local1 := shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 083c7624)) {
                $083c7624();
            } else {
                if (eq(msg.sig, d07c4b2d)) {
                    $d07c4b2d();
                } else {
                    let local2 := 0x0 // #refs 0
                    revert(local2, local2)
                }
            }
        }
        let local1 := 0x0 // #refs 0
        revert(local1, local1)

        function __$083c7624(/*unknown*/) { // public
            let local2 := 0x4 // #refs 0
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x20)))
            sstore(0x0, add(0x1, calldataload(local2)))
            stop()
        }

        function __$d07c4b2d(/*unknown*/) { // public
            let local2 := 0x4 // #refs 0
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x20)))
            let local4 := sub(shl(0x1, 0xa0), 0x1) // #refs 0
            require(eq(and(caller(), local4), and(local4, sload(0x1))), 0x8c379a000000000000000000000000000000000000000000000000000000000, 0x20, 0x20, 0x4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572)
            sstore(0x0, add(0x3, calldataload(local2)))
            stop()
        }

    }
}

```

```mermaid -opt
---
title: modifier-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|local0
memory[0x40] = 0x80;
undefined local0 = msg.value; // #refs 0
when msg.value == 0 goto 15 or fall 11
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_11 ["pc @11"]
    s_1("pc @11 (#s_1)
=|local0
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_1 state
  end
  subgraph cluster_15 ["pc @15"]
    s_2("pc @15 (#s_2)
=|
when msg.data.length < 0x4 goto 50 or fall 24
")
    class s_2 state
  end
  subgraph cluster_24 ["pc @24"]
    s_3("pc @24 (#s_3)
=|local1
undefined local1 = msg.data >>> 0xe0; // #refs 1
case when msg.sig == 083c7624 goto [J]0x37 or fall 40
")
    class s_3 state
  end
  subgraph cluster_40 ["pc @40"]
    s_4("pc @40 (#s_4)
=|local1
case when msg.sig == d07c4b2d goto [J]0x53 or fall 50
")
    class s_4 state
  end
  subgraph cluster_50 ["pc @50"]
    s_5("pc @50 (#s_5)
=|local1
undefined local2 = 0x0; // #refs 0
revert();
")
    class s_5 state
    s_6("pc @50 (#s_6)
=|
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_6 state
  end
  subgraph cluster_55 ["pc @55"]
    s_7[["pc @55 (#s_7)
=|local3|local2|[J]0x51|local1
undefined local2 = 0x4; // #refs 0
undefined local3 = msg.data.length - 0x4; // #refs 0
when (msg.data.length - 0x4 < 0x20) == 0 goto 75 or fall 71
"]]
    class s_7 state
    style s_7 fill:#5F021F
  end
  subgraph cluster_71 ["pc @71"]
    s_8("pc @71 (#s_8)
=|local3|local2|[J]0x51|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_8 state
  end
  subgraph cluster_75 ["pc @75"]
    s_9("pc @75 (#s_9)
=|calldataload(local2)|[J]0x51|local1
goto :[J]0x6d branch:109
")
    class s_9 state
  end
  subgraph cluster_109 ["pc @109"]
    s_10("pc @109 (#s_10)
=|local1
var_1 = 0x1 + msg.data[0x4];
goto :[J]0x51 branch:81
")
    class s_10 state
  end
  subgraph cluster_81 ["pc @81"]
    s_11("pc @81 (#s_11)
=|local1
return;
")
    class s_11 state
    s_20("pc @81 (#s_20)
=|local1
return;
")
    class s_20 state
  end
  subgraph cluster_83 ["pc @83"]
    s_12[["pc @83 (#s_12)
=|local3|local2|[J]0x51|local1
undefined local2 = 0x4; // #refs 0
undefined local3 = msg.data.length - 0x4; // #refs 0
when (msg.data.length - 0x4 < 0x20) == 0 goto 103 or fall 99
"]]
    class s_12 state
    style s_12 fill:#5F021F
  end
  subgraph cluster_99 ["pc @99"]
    s_13("pc @99 (#s_13)
=|local3|local2|[J]0x51|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_13 state
  end
  subgraph cluster_103 ["pc @103"]
    s_14("pc @103 (#s_14)
=|calldataload(local2)|[J]0x51|local1
goto :[J]0x75 branch:117
")
    class s_14 state
  end
  subgraph cluster_117 ["pc @117"]
    s_15("pc @117 (#s_15)
=|[J]0x7b|calldataload(local2)|[J]0x51|local1
goto :[J]0xe4 branch:228
")
    class s_15 state
  end
  subgraph cluster_228 ["pc @228"]
    s_16("pc @228 (#s_16)
=|caller()|calldataload(local2)|[J]0x51|local1
goto :[J]0x7b branch:123
")
    class s_16 state
  end
  subgraph cluster_123 ["pc @123"]
    s_17("pc @123 (#s_17)
=|calldataload(local2)|[J]0x51|local1
undefined local4 = (0x1 << 0xa0) - 0x1; // #refs 0
when (msg.sender & (0x1 << 0xa0) - 0x1) == ((0x1 << 0xa0) - 0x1 & var_2) goto 220 or fall 144
")
    class s_17 state
  end
  subgraph cluster_144 ["pc @144"]
    s_18("pc @144 (#s_18)
=|calldataload(local2)|[J]0x51|local1
undefined local5 = 0x40; // #refs 0
undefined local6 = memory[0x40]; // #refs 2
memory[local6] = 0x461bcd << 0xe5;
undefined local7 = 0x20; // #refs -2
memory[local6 + 0x4] = 0x20;
memory[local6 + 0x24] = 0x20;
memory[local6 + 0x44] = 0x4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572;
undefined local8 = memory[0x40]; // #refs 0
revert("Ownable: caller is not the owner");
")
    class s_18 state
  end
  subgraph cluster_220 ["pc @220"]
    s_19("pc @220 (#s_19)
=|local1
var_1 = 0x3 + msg.data[0x4];
goto :[J]0x51 branch:81
")
    class s_19 state
  end
  s_0 == jumpi0_0 ==> s_2;
  s_0 -- fall --> s_1;
  s_2 == jumpi2_2 ==> s_6;
  s_2 -- fall --> s_3;
  s_3 -- fall --> s_4;
  s_4 -- fall --> s_5;
  s_7 == jumpi7_7 ==> s_9;
  s_7 -- fall --> s_8;
  s_9 == jump9_9 ==> s_10;
  s_10 == jump7_10 ==> s_11;
  s_7 -...- s_10;
  s_12 == jumpi12_12 ==> s_14;
  s_12 -- fall --> s_13;
  s_14 == jump14_14 ==> s_15;
  s_15 == jump15_15 ==> s_16;
  s_16 == jump15_16 ==> s_17;
  s_15 -...- s_16;
  s_17 == jumpi17_17 ==> s_19;
  s_17 -- fall --> s_18;
  s_19 == jump12_19 ==> s_20;
  s_12 -...- s_19;

```

```errors -opt
[]
```
