# contracts/empty/with no functions

```sol -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://Qmc7NUcdp12QQzhVAMQGPVCLb19V1ifakkLWL7SgvUoYkM
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        revert();
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

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
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lundefined local0 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }


}

```

```sol -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmbfibgUvdfkZYGTTwQsEqWF8srkJCoMFMsMyAjFSmGw4S
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        revert();
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

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
    "id-0" [label="pc @0 (id-0)\l=| \lmemory[0x40] = 0x80;\lundefined local0 = 0x0; // #refs 0\lrevert();\l" fillcolor="#cf91f7"];
  }


}

```
