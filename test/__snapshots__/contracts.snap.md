# ::contracts

```solidity empty/with-no-functions/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://Qmc7NUcdp12QQzhVAMQGPVCLb19V1ifakkLWL7SgvUoYkM
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        revert();
    }

}

```

```yul empty/with-no-functions/match-Yul-snapshot
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

    }
}

```

```solidity locals/no-dedup-local-variable-with-emit/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmR3j8ecZd9cGBspFUPWFJMuocmpCatPtfUxyqiCS8K1kB
pragma solidity 0.7.6;

contract Contract {

    event 4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426;

    fallback() external payable {
        uint local0 = block.number; // #refs 1
        log(0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426, local0);
        log(0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426, local0);
        return;
    }

}

```

```yul locals/no-dedup-local-variable-with-emit/match-Yul-snapshot
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = number() // #refs 1
        let local1 = mload(0x40) // #refs 0
        mstore(local1, local0)
        let local2 = mload(0x40) // #refs 0
        log1(local2, sub(add(0x20, local1), local2), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
        let local3 = mload(0x40) // #refs 0
        mstore(local3, local0)
        let local4 = mload(0x40) // #refs 0
        log1(local4, sub(add(0x20, local3), local4), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
        stop()

    }
}

```

```solidity locals/no-dedup-local-variable-with-emit-optimized/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmSeJbVEgSPm1gJ7wnPsmsSShhZuBgfsjM7qkTsS1SPe1x
pragma solidity 0.7.6;

contract Contract {

    event 4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426;

    fallback() external payable {
        log(0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426, block.number);
        log(0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426, block.number);
        return;
    }

}

```

```yul locals/no-dedup-local-variable-with-emit-optimized/match-Yul-snapshot
object "runtime" {
    code {
        let local0 = 0x80 // #refs -1
        mstore(0x40, local0)
        let local1 = number() // #refs -1
        mstore(local0, local1)
        log1(local0, 0x20, 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
        let local2 = 0x40 // #refs 0
        let local3 = mload(local2) // #refs -1
        mstore(local3, local1)
        let local4 = mload(local2) // #refs 0
        log1(local4, add(0x20, sub(local3, local4)), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)
        stop()

    }
}

```

```solidity dispatch/pure-payable-and-non-payable-functions/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://Qmbq3oLNpZcm17Gb7pxnFJnka9fmjwtwMTg5xCnt3E7Xix
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

    function 6d4ce63c() public payable returns (uint256) {
        require(msg.value == 0);
        return 0x1;
    }

}

```

```yul dispatch/pure-payable-and-non-payable-functions/match-Yul-snapshot
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

        /*public*/ function $5d2c7ee6() {
            let local1 = mload(0x40) // #refs 0
            let local2 = 0x1 // #refs -1
            mstore(local1, local2)
            let local3 = mload(0x40) // #refs 0
            return(local3, sub(add(0x20, local1), local3))
        }

        /*public*/ function $6d4ce63c() {
            let local1 = callvalue() // #refs 0
            require(iszero(local1));
            let local2 = mload(0x40) // #refs 0
            let local3 = 0x1 // #refs -1
            mstore(local2, local3)
            let local4 = mload(0x40) // #refs 0
            return(local4, sub(add(0x20, local2), local4))
        }

    }
}

```

```solidity dispatch/pure-payable-and-non-payable-functions-optimized/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmXbZWxxMqei9Rfz17KsZ9b9ei3AtyTbqePnX7jzrQzSPC
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

    function 6d4ce63c() public payable returns (uint256) {
        require(msg.value == 0);
        return 0x1;
    }

}

```

```yul dispatch/pure-payable-and-non-payable-functions-optimized/match-Yul-snapshot
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

        /*public*/ function $5d2c7ee6() {
            let local1 = 0x40 // #refs 0
            let local2 = mload(local1) // #refs -1
            mstore(local2, 0x1)
            let local3 = mload(local1) // #refs 0
            return(local3, add(0x20, sub(local2, local3)))
        }

        /*public*/ function $6d4ce63c() {
            let local1 = callvalue() // #refs 0
            require(iszero(local1));
            let local2 = 0x40 // #refs 0
            let local3 = mload(local2) // #refs -1
            mstore(local3, 0x1)
            let local4 = mload(local2) // #refs 0
            return(local4, add(0x20, sub(local3, local4)))
        }

    }
}

```
