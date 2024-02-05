# contracts/mappings/public mapping

```solidity -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmXUabbCeD7Lv8du5q45dZYekx8Qw9ACfgCuRRaMifyEU8
pragma solidity 0.7.6;

contract Contract {

    mapping (address => mapping (address => unknown)) public allowance;

    fallback() external payable {
        require(msg.value == 0);
        if ((msg.data.length < 0x4) == 0) {
            undefined local1 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 20965255) {
                $20965255();
            } else {
                if (msg.sig == dd62ed3e) {
                    $dd62ed3e();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function getValue() public returns (unknown) {
        return allowance[msg.sender][msg.sender];
    }

    function allowance(address _arg0, address _arg1) public returns (unknown) {
        undefined local2 = 0x4; // #refs 3
        require((msg.data.length - local2 < 0x40) == 0);
        return allowance[_arg0][_arg1];
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
            if (eq(msg.sig, 20965255)) {
                $20965255();
            } else {
                if (eq(msg.sig, dd62ed3e)) {
                    $dd62ed3e();
                } else {
                    let local2 := 0x0 // #refs 0
                    revert(local2, local2)
                }
            }
        }
        let local1 := 0x0 // #refs 0
        revert(local1, local1)

        function getValue() { // public
            let local2 := 0x0 // #refs -1
            let local3 := 0x0 // #refs -1
            mstore(local3/*=0x0*/, and(0xffffffffffffffffffffffffffffffffffffffff, and(0xffffffffffffffffffffffffffffffffffffffff, caller())))
            let local4 := add(0x20, local3) // #refs -1
            mstore(local4/*=0x20*/, local2)
            let local5 := 0x0 // #refs -1
            mstore(local5/*=0x0*/, and(0xffffffffffffffffffffffffffffffffffffffff, and(0xffffffffffffffffffffffffffffffffffffffff, caller())))
            let local6 := add(0x20, local5) // #refs -1
            mstore(local6/*=0x20*/, keccak256(0x0, add(0x20, local4) /*caller().0x0*/))
            let local7 := mload(0x40) // #refs 0
            let local8 := sload(keccak256(0x0, add(0x20, local6) /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/) // #refs -1
            mstore(local7/*=0x80*/, local8)
            let local9 := mload(0x40) // #refs 0
            return(local9, sub(add(0x20, local7), local9)) // sload(keccak256(0x0, add(0x20, local6) /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/)
        }

        function allowance(address _arg0, address _arg1) { // public
            let local2 := 0x4 // #refs 3
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x40)))
            let local4 := add(0x20, local2) // #refs 0
            mstore(0x20, 0x0)
            let local5 := and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local2)) // #refs -1
            mstore(0x0, local5)
            mstore(0x20, keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/))
            let local6 := and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local4)) // #refs -1
            mstore(0x0, local6)
            let local7 := [J]0xbb // #refs 0
            let local8 := mload(0x40) // #refs 0
            let local9 := sload(keccak256(0x0, 0x40 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/) // #refs -1
            mstore(local8/*=0x80*/, local9)
            let local10 := mload(0x40) // #refs 0
            return(local10, sub(add(0x20, local8), local10)) // sload(keccak256(0x0, 0x40 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/)
        }

    }
}

```

```mermaid -no-opt
---
title: public mapping-no-opt
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
case when msg.sig == 20965255 goto [J]0x3b or fall 43
")
    class s_3 state
  end
  subgraph cluster_43 ["pc @43"]
    s_4("pc @43 (#s_4)
=|local1
case when msg.sig == dd62ed3e goto [J]0x59 or fall 54
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
=|[J]0x43|local1
goto :[J]0xd1 branch:209
"]]
    class s_7 state
    style s_7 fill:#5F021F
  end
  subgraph cluster_209 ["pc @209"]
    s_8("pc @209 (#s_8)
=|sload(keccak256(0x0, add(0x20, local6) /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/)|local1
undefined local2 = 0x0; // #refs -1
undefined local3 = 0x0; // #refs -1
memory[0x0] = 0xffffffffffffffffffffffffffffffffffffffff & 0xffffffffffffffffffffffffffffffffffffffff & msg.sender;
undefined local4 = 0x20 + 0x0; // #refs -1
memory[0x20 + 0x0] = 0x0;
undefined local5 = 0x0; // #refs -1
memory[0x0] = 0xffffffffffffffffffffffffffffffffffffffff & 0xffffffffffffffffffffffffffffffffffffffff & msg.sender;
undefined local6 = 0x20 + 0x0; // #refs -1
memory[0x20 + 0x0] = keccak256(msg.sender, 0x0);
goto :[J]0x43 branch:67
")
    class s_8 state
  end
  subgraph cluster_67 ["pc @67"]
    s_9("pc @67 (#s_9)
=|local1
undefined local7 = memory[0x40]; // #refs 0
undefined local8 = allowance[msg.sender][msg.sender]; // #refs -1
memory[memory[0x40]] = allowance[msg.sender][msg.sender];
undefined local9 = memory[0x40]; // #refs 0
return allowance[msg.sender][msg.sender];
")
    class s_9 state
  end
  subgraph cluster_89 ["pc @89"]
    s_10[["pc @89 (#s_10)
=|local3|local2|[J]0xbb|local1
undefined local2 = 0x4; // #refs 3
undefined local3 = msg.data.length - local2; // #refs 0
when (msg.data.length - local2 < 0x40) == 0 goto 111 or fall 107
"]]
    class s_10 state
    style s_10 fill:#5F021F
  end
  subgraph cluster_107 ["pc @107"]
    s_11("pc @107 (#s_11)
=|local3|local2|[J]0xbb|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_11 state
  end
  subgraph cluster_111 ["pc @111"]
    s_12("pc @111 (#s_12)
=|and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local4))|and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local2))|[J]0xbb|local1
undefined local4 = 0x20 + local2; // #refs 0
goto :[J]0x154 branch:340
")
    class s_12 state
  end
  subgraph cluster_340 ["pc @340"]
    s_13("pc @340 (#s_13)
=|sload(keccak256(0x0, 0x40 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/)|local7|local1
memory[0x20] = 0x0;
undefined local5 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[local2]; // #refs -1
memory[0x0] = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[local2];
memory[0x20] = keccak256(_arg0, 0x0);
undefined local6 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local2]; // #refs -1
memory[0x0] = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local2];
undefined local7 = [J]0xbb; // #refs 0
goto :[J]0xbb branch:187
")
    class s_13 state
  end
  subgraph cluster_187 ["pc @187"]
    s_14("pc @187 (#s_14)
=|local7|local1
undefined local8 = memory[0x40]; // #refs 0
undefined local9 = allowance[_arg0][_arg1]; // #refs -1
memory[memory[0x40]] = allowance[_arg0][_arg1];
undefined local10 = memory[0x40]; // #refs 0
return allowance[_arg0][_arg1];
")
    class s_14 state
  end
  s_0 == jumpi0_0 ==> s_2;
  s_0 -- fall --> s_1;
  s_2 == jumpi2_2 ==> s_6;
  s_2 -- fall --> s_3;
  s_3 -- fall --> s_4;
  s_4 -- fall --> s_5;
  s_7 == jump7_7 ==> s_8;
  s_8 == jump7_8 ==> s_9;
  s_7 -...- s_8;
  s_10 == jumpi10_10 ==> s_12;
  s_10 -- fall --> s_11;
  s_12 == jump12_12 ==> s_13;
  s_13 == jump10_13 ==> s_14;
  s_10 -...- s_13;

```

```errors -no-opt
[]
```

```solidity -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmSrjZkbwKtEg7uMhwXX3nW2nesTsmJYYH2ns4jkXWmEqs
pragma solidity 0.7.6;

contract Contract {

    mapping (address => mapping (address => unknown)) public allowance;

    fallback() external payable {
        require(msg.value == 0);
        if ((msg.data.length < 0x4) == 0) {
            undefined local1 = msg.data >>> 0xe0; // #refs 1
            if (msg.sig == 20965255) {
                $20965255();
            } else {
                if (msg.sig == dd62ed3e) {
                    $dd62ed3e();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function getValue() public returns (unknown) {
        return allowance[msg.sender][msg.sender];
    }

    function allowance(address _arg0, address _arg1) public returns (unknown) {
        undefined local2 = 0x4; // #refs 1
        require((msg.data.length - local2 < 0x40) == 0);
        return allowance[_arg0][_arg1];
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
            if (eq(msg.sig, 20965255)) {
                $20965255();
            } else {
                if (eq(msg.sig, dd62ed3e)) {
                    $dd62ed3e();
                } else {
                    let local2 := 0x0 // #refs 0
                    revert(local2, local2)
                }
            }
        }
        let local1 := 0x0 // #refs 0
        revert(local1, local1)

        function getValue() { // public
            let local2 := 0x0 // #refs 0
            mstore(local2/*=0x0*/, caller())
            let local3 := 0x20 // #refs -2
            mstore(local3/*=0x20*/, local2)
            let local4 := 0x40 // #refs 0
            mstore(local3/*=0x20*/, keccak256(local2, local4 /*caller().0x0*/))
            let local5 := 0x40 // #refs 0
            let local6 := mload(local5) // #refs -1
            mstore(local6/*=0x80*/, sload(keccak256(local2, local4 /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/))
            let local7 := mload(local5) // #refs 0
            return(local7, add(0x20, sub(local6, local7))) // sload(keccak256(local2, local4 /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/)
        }

        function allowance(address _arg0, address _arg1) { // public
            let local2 := 0x4 // #refs 1
            let local3 := sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x40)))
            let local4 := sub(shl(0x1, 0xa0), 0x1) // #refs 0
            let local5 := 0x0 // #refs 0
            let local6 := 0x20 // #refs -2
            mstore(local6/*=0x20*/, local5)
            mstore(local5/*=0x0*/, and(local4, calldataload(local2)))
            let local7 := 0x40 // #refs 0
            mstore(local6/*=0x20*/, keccak256(local5, local7 /*calldataload(0x4).0x0*/))
            mstore(local5/*=0x0*/, and(calldataload(add(0x20, local2)), local4))
            let local8 := [J]0x3d // #refs 0
            let local9 := 0x40 // #refs 0
            let local10 := mload(local9) // #refs -1
            mstore(local10/*=0x80*/, sload(keccak256(local5, local7 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/))
            let local11 := mload(local9) // #refs 0
            return(local11, add(0x20, sub(local10, local11))) // sload(keccak256(local5, local7 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/)
        }

    }
}

```

```mermaid -opt
---
title: public mapping-opt
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
case when msg.sig == 20965255 goto [J]0x37 or fall 40
")
    class s_3 state
  end
  subgraph cluster_40 ["pc @40"]
    s_4("pc @40 (#s_4)
=|local1
case when msg.sig == dd62ed3e goto [J]0x4f or fall 50
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
=|[J]0x3d|local1
goto :[J]0x7a branch:122
"]]
    class s_7 state
    style s_7 fill:#5F021F
  end
  subgraph cluster_122 ["pc @122"]
    s_8("pc @122 (#s_8)
=|sload(keccak256(local2, local4 /*caller().keccak256(0x0, 0x40 /*caller().0x0*/)*/)/*base0[caller()][caller()]*/)|local1
undefined local2 = 0x0; // #refs 0
memory[0x0] = msg.sender;
undefined local3 = 0x20; // #refs -2
memory[0x20] = 0x0;
undefined local4 = 0x40; // #refs 0
memory[0x20] = keccak256(msg.sender, 0x0);
goto :[J]0x3d branch:61
")
    class s_8 state
  end
  subgraph cluster_61 ["pc @61"]
    s_9("pc @61 (#s_9)
=|local1
undefined local5 = 0x40; // #refs 0
undefined local6 = memory[0x40]; // #refs -1
memory[memory[0x40]] = allowance[msg.sender][msg.sender];
undefined local7 = memory[0x40]; // #refs 0
return allowance[msg.sender][msg.sender];
")
    class s_9 state
    s_14("pc @61 (#s_14)
=|local8|local1
undefined local9 = 0x40; // #refs 0
undefined local10 = memory[0x40]; // #refs -1
memory[memory[0x40]] = allowance[_arg0][_arg1];
undefined local11 = memory[0x40]; // #refs 0
return allowance[_arg0][_arg1];
")
    class s_14 state
  end
  subgraph cluster_79 ["pc @79"]
    s_10[["pc @79 (#s_10)
=|local3|local2|[J]0x3d|local1
undefined local2 = 0x4; // #refs 1
undefined local3 = msg.data.length - local2; // #refs 0
when (msg.data.length - local2 < 0x40) == 0 goto 99 or fall 95
"]]
    class s_10 state
    style s_10 fill:#5F021F
  end
  subgraph cluster_95 ["pc @95"]
    s_11("pc @95 (#s_11)
=|local3|local2|[J]0x3d|local1
undefined local4 = 0x0; // #refs 0
revert();
")
    class s_11 state
  end
  subgraph cluster_99 ["pc @99"]
    s_12("pc @99 (#s_12)
=|and(calldataload(add(0x20, local2)), local4)|and(local4, calldataload(local2))|[J]0x3d|local1
undefined local4 = (0x1 << 0xa0) - 0x1; // #refs 0
goto :[J]0x93 branch:147
")
    class s_12 state
  end
  subgraph cluster_147 ["pc @147"]
    s_13("pc @147 (#s_13)
=|sload(keccak256(local5, local7 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/)|local8|local1
undefined local5 = 0x0; // #refs 0
undefined local6 = 0x20; // #refs -2
memory[0x20] = 0x0;
memory[0x0] = (0x1 << 0xa0) - 0x1 & msg.data[local2];
undefined local7 = 0x40; // #refs 0
memory[0x20] = keccak256(_arg0, 0x0);
memory[0x0] = msg.data[0x20 + local2] & (0x1 << 0xa0) - 0x1;
undefined local8 = [J]0x3d; // #refs 0
goto :[J]0x3d branch:61
")
    class s_13 state
  end
  s_0 == jumpi0_0 ==> s_2;
  s_0 -- fall --> s_1;
  s_2 == jumpi2_2 ==> s_6;
  s_2 -- fall --> s_3;
  s_3 -- fall --> s_4;
  s_4 -- fall --> s_5;
  s_7 == jump7_7 ==> s_8;
  s_8 == jump7_8 ==> s_9;
  s_7 -...- s_8;
  s_10 == jumpi10_10 ==> s_12;
  s_10 -- fall --> s_11;
  s_12 == jump12_12 ==> s_13;
  s_13 == jump10_13 ==> s_14;
  s_10 -...- s_13;

```

```errors -opt
[]
```
