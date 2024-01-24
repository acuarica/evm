# contracts/empty/with no functions

```solidity -no-opt
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

```mermaid -no-opt
---
title: with no functions-no-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (s_0) #0
=|
memory[0x40] = 0x80;
undefined local0 = 0x0; // #refs 0
revert();
"]]
    class s_0 state
    style s_0 fill:#471C21
  end

```

```errors -no-opt
[]
```

```solidity -opt
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

```mermaid -opt
---
title: with no functions-opt
---
flowchart TD
  classDef state text-align:left
  subgraph cluster_0 ["pc @0"]
    s_0[["pc @0 (s_0) #0
=|
memory[0x40] = 0x80;
undefined local0 = 0x0; // #refs 0
revert();
"]]
    class s_0 state
    style s_0 fill:#471C21
  end

```

```errors -opt
[]
```
