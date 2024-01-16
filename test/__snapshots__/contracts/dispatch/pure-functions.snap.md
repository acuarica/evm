# contracts/dispatch/pure functions

```sol -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmRHsusWvnMjnuZciCkG6nDhuk1MKuqDGqGjTaJKWZu36c
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        if (~(msg.data.length < 0x4)) {
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
        if (not(lt(calldatasize(), 0x4))) {
            let local0 = shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 5d2c7ee6)) {
                $5d2c7ee6();
            } else {
                if (eq(msg.sig, 6d4ce63c)) {
                    $6d4ce63c();
                } else {
                    let local1 = 0x0 // #refs 0
                    revert(local1, local1)
                }
            }
        }
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

        function __$5d2c7ee6(/*unknown*/) { // public payable
            let local1 = mload(0x40) // #refs 0
            let local2 = 0x1 // #refs -1
            mstore(local1, local2)
            let local3 = mload(0x40) // #refs 0
            return(local3, sub(add(0x20, local1), local3)) // 0x1
        }

        function get() { // public
            let local1 = callvalue() // #refs 0
            require(iszero(local1));
            let local2 = mload(0x40) // #refs 0
            let local3 = 0x1 // #refs -1
            mstore(local2, local3)
            let local4 = mload(0x40) // #refs 0
            return(local4, sub(add(0x20, local2), local4)) // 0x1
        }

    }
}

```

```graphviz -no-opt
digraph G {    
  color="#efefef";
  graph[fontsize=8];

  node[shape=box style="rounded,filled" fontsize=9 fontname="Arial" fillcolor="#efefef"];

  subgraph cluster_0 {
    style="filled,rounded";
    label = "pc @0";
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lwhen msg.data.length < 0x4 goto 38 or fall 12\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_12 {
    style="filled,rounded";
    label = "pc @12";
    "id-1" [label="pc @12 (id-1)\l=| local0\lundefined local0 = msg.data >>> 0xe0; // #refs 1\lcase when msg.sig == 5d2c7ee6 goto [J]0x2b or fall 28\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_28 {
    style="filled,rounded";
    label = "pc @28";
    "id-2" [label="pc @28 (id-2)\l=| local0\lcase when msg.sig == 6d4ce63c goto [J]0x47 or fall 38\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_38 {
    style="filled,rounded";
    label = "pc @38";
    "id-3" [label="pc @38 (id-3)\l=| local0\lundefined local1 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
    "id-4" [label="pc @38 (id-4)\l=| \lundefined local0 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_43 {
    style="filled,rounded";
    label = "pc @43";
    "id-5" [label="pc @43 (id-5)\l=| [J]0x31|local0\lgoto :[J]0x6f branch:111\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_111 {
    style="filled,rounded";
    label = "pc @111";
    "id-6" [label="pc @111 (id-6)\l=| 0x1|local0\lgoto :[J]0x31 branch:49\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_49 {
    style="filled,rounded";
    label = "pc @49";
    "id-7" [label="pc @49 (id-7)\l=| local0\lundefined local1 = memory[0x40]; // #refs 0\lundefined local2 = 0x1; // #refs -1\lmemory[memory[0x40]] = 0x1;\lundefined local3 = memory[0x40]; // #refs 0\lreturn 0x1;\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_71 {
    style="filled,rounded";
    label = "pc @71";
    "id-8" [label="pc @71 (id-8)\l=| local1|local0\lundefined local1 = msg.value; // #refs 0\lwhen msg.value == 0 goto 82 or fall 78\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_78 {
    style="filled,rounded";
    label = "pc @78";
    "id-9" [label="pc @78 (id-9)\l=| local1|local0\lundefined local2 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_82 {
    style="filled,rounded";
    label = "pc @82";
    "id-10" [label="pc @82 (id-10)\l=| [J]0x59|local0\lgoto :[J]0x78 branch:120\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_120 {
    style="filled,rounded";
    label = "pc @120";
    "id-11" [label="pc @120 (id-11)\l=| 0x1|local0\lgoto :[J]0x59 branch:89\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_89 {
    style="filled,rounded";
    label = "pc @89";
    "id-12" [label="pc @89 (id-12)\l=| local0\lundefined local2 = memory[0x40]; // #refs 0\lundefined local3 = 0x1; // #refs -1\lmemory[memory[0x40]] = 0x1;\lundefined local4 = memory[0x40]; // #refs 0\lreturn 0x1;\l" fillcolor="#cf91f7"];
  }

  "id-0" -> "id-4";
  "id-0" -> "id-1";
  "id-1" -> "id-2";
  "id-2" -> "id-3";
  "id-5" -> "id-6";
  "id-6" -> "id-7";
  "id-8" -> "id-10";
  "id-8" -> "id-9";
  "id-10" -> "id-11";
  "id-11" -> "id-12";

}

```

```sol -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmageuWBk2AFaFebYDj6s8YjF6CWqQrsJ3FVvzXcJwQwsN
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        if (~(msg.data.length < 0x4)) {
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
        if (not(lt(calldatasize(), 0x4))) {
            let local0 = shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 5d2c7ee6)) {
                $5d2c7ee6();
            } else {
                if (eq(msg.sig, 6d4ce63c)) {
                    $6d4ce63c();
                } else {
                    let local1 = 0x0 // #refs 0
                    revert(local1, local1)
                }
            }
        }
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

        function __$5d2c7ee6(/*unknown*/) { // public payable
            let local1 = 0x40 // #refs 0
            let local2 = mload(local1) // #refs -1
            mstore(local2, 0x1)
            let local3 = mload(local1) // #refs 0
            return(local3, add(0x20, sub(local2, local3))) // 0x1
        }

        function get() { // public
            let local1 = callvalue() // #refs 0
            require(iszero(local1));
            let local2 = 0x40 // #refs 0
            let local3 = mload(local2) // #refs -1
            mstore(local3, 0x1)
            let local4 = mload(local2) // #refs 0
            return(local4, add(0x20, sub(local3, local4))) // 0x1
        }

    }
}

```

```graphviz -opt
digraph G {    
  color="#efefef";
  graph[fontsize=8];

  node[shape=box style="rounded,filled" fontsize=9 fontname="Arial" fillcolor="#efefef"];

  subgraph cluster_0 {
    style="filled,rounded";
    label = "pc @0";
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lwhen msg.data.length < 0x4 goto 38 or fall 12\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_12 {
    style="filled,rounded";
    label = "pc @12";
    "id-1" [label="pc @12 (id-1)\l=| local0\lundefined local0 = msg.data >>> 0xe0; // #refs 1\lcase when msg.sig == 5d2c7ee6 goto [J]0x2b or fall 28\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_28 {
    style="filled,rounded";
    label = "pc @28";
    "id-2" [label="pc @28 (id-2)\l=| local0\lcase when msg.sig == 6d4ce63c goto [J]0x43 or fall 38\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_38 {
    style="filled,rounded";
    label = "pc @38";
    "id-3" [label="pc @38 (id-3)\l=| local0\lundefined local1 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
    "id-4" [label="pc @38 (id-4)\l=| \lundefined local0 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_43 {
    style="filled,rounded";
    label = "pc @43";
    "id-5" [label="pc @43 (id-5)\l=| [J]0x31|local0\lgoto :[J]0x52 branch:82\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_82 {
    style="filled,rounded";
    label = "pc @82";
    "id-6" [label="pc @82 (id-6)\l=| 0x1|local0\lgoto :[J]0x31 branch:49\l" fillcolor="#cf91f7"];
    "id-7" [label="pc @82 (id-7)\l=| 0x1|local0\lgoto :[J]0x31 branch:49\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_49 {
    style="filled,rounded";
    label = "pc @49";
    "id-8" [label="pc @49 (id-8)\l=| local0\lundefined local1 = 0x40; // #refs 0\lundefined local2 = memory[0x40]; // #refs -1\lmemory[memory[0x40]] = 0x1;\lundefined local3 = memory[0x40]; // #refs 0\lreturn 0x1;\l" fillcolor="#cf91f7"];
    "id-9" [label="pc @49 (id-9)\l=| local0\lundefined local2 = 0x40; // #refs 0\lundefined local3 = memory[0x40]; // #refs -1\lmemory[memory[0x40]] = 0x1;\lundefined local4 = memory[0x40]; // #refs 0\lreturn 0x1;\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_67 {
    style="filled,rounded";
    label = "pc @67";
    "id-10" [label="pc @67 (id-10)\l=| local1|local0\lundefined local1 = msg.value; // #refs 0\lwhen msg.value == 0 goto 78 or fall 74\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_74 {
    style="filled,rounded";
    label = "pc @74";
    "id-11" [label="pc @74 (id-11)\l=| local1|local0\lundefined local2 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_78 {
    style="filled,rounded";
    label = "pc @78";
    "id-12" [label="pc @78 (id-12)\l=| [J]0x31|local0\lfall: 82:\l" fillcolor="#cf91f7"];
  }

  "id-0" -> "id-4";
  "id-0" -> "id-1";
  "id-1" -> "id-2";
  "id-2" -> "id-3";
  "id-5" -> "id-6";
  "id-6" -> "id-8";
  "id-7" -> "id-9";
  "id-10" -> "id-12";
  "id-10" -> "id-11";
  "id-12" -> "id-7";

}

```
