# contracts/system/selfdestruct

```sol -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmVxFdWfLZNK7URjamqvyzq2oL29wiXKHQ9VVPnLgu5xoG
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        selfdestruct(0xffffffffffffffffffffffffffffffffffffffff & msg.sender);
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        selfdestruct(and(0xffffffffffffffffffffffffffffffffffffffff, caller()))

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
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lselfdestruct(0xffffffffffffffffffffffffffffffffffffffff & msg.sender);\l" fillcolor="#cf91f7"];
  }


}

```

```sol -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmTYoyy7D6orDPjDivuJFhPvSFdRUnpJnq7jYhSE61Nsot
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        selfdestruct(msg.sender);
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        selfdestruct(caller())

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
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lselfdestruct(msg.sender);\l" fillcolor="#cf91f7"];
  }


}

```
