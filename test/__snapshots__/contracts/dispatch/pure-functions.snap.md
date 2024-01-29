# contracts/dispatch/pure functions

```solidity -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmRHsusWvnMjnuZciCkG6nDhuk1MKuqDGqGjTaJKWZu36c
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        if ((msg.data.length < 0x4) == 0) {
            undefined local0 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 5d2c7ee6) {
                $5d2c7ee6();
            } else {
                if (msg.sig == 6d4ce63c) {
                    $6d4ce63c();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function 5d2c7ee6() public payable returns (uint256) {
        return 0x1;
    }

    function get() public returns (uint256) {
        require(msg.value == 0);
        return 0x1;
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        if (iszero(lt(calldatasize(), 0x4))) {
            let local0 := shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 5d2c7ee6)) {
                $5d2c7ee6();
            } else {
                if (eq(msg.sig, 6d4ce63c)) {
                    $6d4ce63c();
                } else {
                    let local1 := 0x0 // #refs 0
                    revert(local1, local1)
                }
            }
        }
        let local0 := 0x0 // #refs 0
        revert(local0, local0)

        function __$5d2c7ee6(/*unknown*/) { // public payable
            let local1 := mload(0x40) // #refs 0
            let local2 := 0x1 // #refs -1
            mstore(local1, local2)
            let local3 := mload(0x40) // #refs 0
            return(local3, sub(add(0x20, local1), local3)) // 0x1
        }

        function get() { // public
            let local1 := callvalue() // #refs 0
            require(iszero(local1))
            let local2 := mload(0x40) // #refs 0
            let local3 := 0x1 // #refs -1
            mstore(local2, local3)
            let local4 := mload(0x40) // #refs 0
            return(local4, sub(add(0x20, local2), local4)) // 0x1
        }

    }
}

```

```mermaid -no-opt
---
title: pure functions-no-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|
memory[0x40] = 0x80;
when msg.data.length < 0x4 goto 38 or fall 12
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_12 ["pc @12"]
    s_1("pc @12 (#s_1)
=|local0
undefined local0 = msg.data >>> 0xe0; // #refs 1
case when msg.sig == 5d2c7ee6 goto [J]0x2b or fall 28
")
    class s_1 state
  end
  subgraph cluster_28 ["pc @28"]
    s_2("pc @28 (#s_2)
=|local0
case when msg.sig == 6d4ce63c goto [J]0x47 or fall 38
")
    class s_2 state
  end
  subgraph cluster_38 ["pc @38"]
    s_3("pc @38 (#s_3)
=|local0
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_3 state
    s_4("pc @38 (#s_4)
=|
undefined local0 = 0x0; // #refs 0
revert();
")
    class s_4 state
  end
  subgraph cluster_43 ["pc @43"]
    s_5[["pc @43 (#s_5)
=|[J]0x31|local0
goto :[J]0x6f branch:111
"]]
    class s_5 state
    style s_5 fill:#5F021F
  end
  subgraph cluster_111 ["pc @111"]
    s_6("pc @111 (#s_6)
=|0x1|local0
goto :[J]0x31 branch:49
")
    class s_6 state
  end
  subgraph cluster_49 ["pc @49"]
    s_7("pc @49 (#s_7)
=|local0
undefined local1 = memory[0x40]; // #refs 0
undefined local2 = 0x1; // #refs -1
memory[memory[0x40]] = 0x1;
undefined local3 = memory[0x40]; // #refs 0
return 0x1;
")
    class s_7 state
  end
  subgraph cluster_71 ["pc @71"]
    s_8[["pc @71 (#s_8)
=|local1|local0
undefined local1 = msg.value; // #refs 0
when msg.value == 0 goto 82 or fall 78
"]]
    class s_8 state
    style s_8 fill:#5F021F
  end
  subgraph cluster_78 ["pc @78"]
    s_9("pc @78 (#s_9)
=|local1|local0
undefined local2 = 0x0; // #refs 0
revert();
")
    class s_9 state
  end
  subgraph cluster_82 ["pc @82"]
    s_10("pc @82 (#s_10)
=|[J]0x59|local0
goto :[J]0x78 branch:120
")
    class s_10 state
  end
  subgraph cluster_120 ["pc @120"]
    s_11("pc @120 (#s_11)
=|0x1|local0
goto :[J]0x59 branch:89
")
    class s_11 state
  end
  subgraph cluster_89 ["pc @89"]
    s_12("pc @89 (#s_12)
=|local0
undefined local2 = memory[0x40]; // #refs 0
undefined local3 = 0x1; // #refs -1
memory[memory[0x40]] = 0x1;
undefined local4 = memory[0x40]; // #refs 0
return 0x1;
")
    class s_12 state
  end
  s_0 == jumpi0_0 ==> s_4;
  s_0 -- fall --> s_1;
  s_1 -- fall --> s_2;
  s_2 -- fall --> s_3;
  s_5 == jump5_5 ==> s_6;
  s_6 == jump5_6 ==> s_7;
  s_5 -...- s_6;
  s_8 == jumpi8_8 ==> s_10;
  s_8 -- fall --> s_9;
  s_10 == jump10_10 ==> s_11;
  s_11 == jump10_11 ==> s_12;
  s_10 -...- s_11;

```

```errors -no-opt
[]
```

```solidity -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmageuWBk2AFaFebYDj6s8YjF6CWqQrsJ3FVvzXcJwQwsN
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        if ((msg.data.length < 0x4) == 0) {
            undefined local0 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 5d2c7ee6) {
                $5d2c7ee6();
            } else {
                if (msg.sig == 6d4ce63c) {
                    $6d4ce63c();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function 5d2c7ee6() public payable returns (uint256) {
        return 0x1;
    }

    function get() public returns (uint256) {
        require(msg.value == 0);
        return 0x1;
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        if (iszero(lt(calldatasize(), 0x4))) {
            let local0 := shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 5d2c7ee6)) {
                $5d2c7ee6();
            } else {
                if (eq(msg.sig, 6d4ce63c)) {
                    $6d4ce63c();
                } else {
                    let local1 := 0x0 // #refs 0
                    revert(local1, local1)
                }
            }
        }
        let local0 := 0x0 // #refs 0
        revert(local0, local0)

        function __$5d2c7ee6(/*unknown*/) { // public payable
            let local1 := 0x40 // #refs 0
            let local2 := mload(local1) // #refs -1
            mstore(local2, 0x1)
            let local3 := mload(local1) // #refs 0
            return(local3, add(0x20, sub(local2, local3))) // 0x1
        }

        function get() { // public
            let local1 := callvalue() // #refs 0
            require(iszero(local1))
            let local2 := 0x40 // #refs 0
            let local3 := mload(local2) // #refs -1
            mstore(local3, 0x1)
            let local4 := mload(local2) // #refs 0
            return(local4, add(0x20, sub(local3, local4))) // 0x1
        }

    }
}

```

```mermaid -opt
---
title: pure functions-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (#s_0)
=|
memory[0x40] = 0x80;
when msg.data.length < 0x4 goto 38 or fall 12
"]]
    class s_0 state
    style s_0 fill:#471C21
  end
  subgraph cluster_12 ["pc @12"]
    s_1("pc @12 (#s_1)
=|local0
undefined local0 = msg.data >>> 0xe0; // #refs 1
case when msg.sig == 5d2c7ee6 goto [J]0x2b or fall 28
")
    class s_1 state
  end
  subgraph cluster_28 ["pc @28"]
    s_2("pc @28 (#s_2)
=|local0
case when msg.sig == 6d4ce63c goto [J]0x43 or fall 38
")
    class s_2 state
  end
  subgraph cluster_38 ["pc @38"]
    s_3("pc @38 (#s_3)
=|local0
undefined local1 = 0x0; // #refs 0
revert();
")
    class s_3 state
    s_4("pc @38 (#s_4)
=|
undefined local0 = 0x0; // #refs 0
revert();
")
    class s_4 state
  end
  subgraph cluster_43 ["pc @43"]
    s_5[["pc @43 (#s_5)
=|[J]0x31|local0
goto :[J]0x52 branch:82
"]]
    class s_5 state
    style s_5 fill:#5F021F
  end
  subgraph cluster_82 ["pc @82"]
    s_6("pc @82 (#s_6)
=|0x1|local0
goto :[J]0x31 branch:49
")
    class s_6 state
    s_11("pc @82 (#s_11)
=|0x1|local0
goto :[J]0x31 branch:49
")
    class s_11 state
  end
  subgraph cluster_49 ["pc @49"]
    s_7("pc @49 (#s_7)
=|local0
undefined local1 = 0x40; // #refs 0
undefined local2 = memory[0x40]; // #refs -1
memory[memory[0x40]] = 0x1;
undefined local3 = memory[0x40]; // #refs 0
return 0x1;
")
    class s_7 state
    s_12("pc @49 (#s_12)
=|local0
undefined local2 = 0x40; // #refs 0
undefined local3 = memory[0x40]; // #refs -1
memory[memory[0x40]] = 0x1;
undefined local4 = memory[0x40]; // #refs 0
return 0x1;
")
    class s_12 state
  end
  subgraph cluster_67 ["pc @67"]
    s_8[["pc @67 (#s_8)
=|local1|local0
undefined local1 = msg.value; // #refs 0
when msg.value == 0 goto 78 or fall 74
"]]
    class s_8 state
    style s_8 fill:#5F021F
  end
  subgraph cluster_74 ["pc @74"]
    s_9("pc @74 (#s_9)
=|local1|local0
undefined local2 = 0x0; // #refs 0
revert();
")
    class s_9 state
  end
  subgraph cluster_78 ["pc @78"]
    s_10("pc @78 (#s_10)
=|[J]0x31|local0
fall: 82:
")
    class s_10 state
  end
  s_0 == jumpi0_0 ==> s_4;
  s_0 -- fall --> s_1;
  s_1 -- fall --> s_2;
  s_2 -- fall --> s_3;
  s_5 == jump5_5 ==> s_6;
  s_6 == jump5_6 ==> s_7;
  s_5 -...- s_6;
  s_11 == jump10_11 ==> s_12;
  s_10 -...- s_11;
  s_8 == jumpi8_8 ==> s_10;
  s_8 -- fall --> s_9;
  s_10 -- jumpdest --> s_11;

```

```errors -opt
[]
```
