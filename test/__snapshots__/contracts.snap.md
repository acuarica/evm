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

    event Deposit(uint256 _arg0);

    fallback() external payable {
        uint local0 = block.number; // #refs 1
        emit Deposit(local0);
        emit Deposit(local0);
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

    event Deposit(uint256 _arg0);

    fallback() external payable {
        emit Deposit(block.number);
        emit Deposit(block.number);
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

    function get() public returns (uint256) {
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

        function __$5d2c7ee6(/*unknown*/) /*public*/ {
            let local1 = mload(0x40) // #refs 0
            let local2 = 0x1 // #refs -1
            mstore(local1, local2)
            let local3 = mload(0x40) // #refs 0
            return(local3, sub(add(0x20, local1), local3)) // 0x1
        }

        function get() /*public*/ {
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

    function get() public returns (uint256) {
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

        function __$5d2c7ee6(/*unknown*/) /*public*/ {
            let local1 = 0x40 // #refs 0
            let local2 = mload(local1) // #refs -1
            mstore(local2, 0x1)
            let local3 = mload(local1) // #refs 0
            return(local3, add(0x20, sub(local2, local3))) // 0x1
        }

        function get() /*public*/ {
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

```solidity mappings/pure-payable-and-mappings/match-Solidity-snapshot
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmUE6kHz7hCV1hx6JPpoqaNPVBtTHdG5SdX3erkBwnJc8B
pragma solidity 0.7.6;

contract Contract {

mapping (address => mapping (address => unknown)) public allowance;

    fallback() external payable {
        require(msg.value == 0);
        if (~(msg.data.length < 0x4)) {
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

    function getValue() public payable returns (unknown) {
        return allowance[msg.sender][msg.sender];
    }

    function allowance(address _arg0, address _arg1) public payable returns (unknown) {
        undefined local2 = 0x4; // #refs 3
        require((msg.data.length - local2 < 0x40) == 0);
        return allowance[_arg0][_arg1];
    }

}

```

```yul mappings/pure-payable-and-mappings/match-Yul-snapshot
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = callvalue() // #refs 0
        require(iszero(local0));
        if (not(lt(calldatasize(), 0x4))) {
            let local1 = shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 20965255)) {
                $20965255();
            } else {
                if (eq(msg.sig, dd62ed3e)) {
                    $dd62ed3e();
                } else {
                    let local2 = 0x0 // #refs 0
                    revert(local2, local2)
                }
            }
        }
        let local1 = 0x0 // #refs 0
        revert(local1, local1)

        function getValue() /*public*/ {
            let local2 = 0x0 // #refs -1
            let local3 = 0x0 // #refs -1
            mstore(local3, and(0xffffffffffffffffffffffffffffffffffffffff, and(0xffffffffffffffffffffffffffffffffffffffff, caller())))
            let local4 = add(0x20, local3) // #refs -1
            mstore(local4, local2)
            let local5 = 0x0 // #refs -1
            mstore(local5, and(0xffffffffffffffffffffffffffffffffffffffff, and(0xffffffffffffffffffffffffffffffffffffffff, caller())))
            let local6 = add(0x20, local5) // #refs -1
            mstore(local6, keccak256(0x0, add(0x20, local4) /*caller().0x0*/))
            let local7 = mload(0x40) // #refs 0
            let local8 = sload(keccak256(0x0, add(0x20, local6) /*caller().keccak256(0x0, add(0x20, local4) /*caller().0x0*/)*/)/*base0[caller()][caller()]*/) // #refs -1
            mstore(local7, local8)
            let local9 = mload(0x40) // #refs 0
            return(local9, sub(add(0x20, local7), local9)) // sload(keccak256(0x0, add(0x20, local6) /*caller().keccak256(0x0, add(0x20, local4) /*caller().0x0*/)*/)/*base0[caller()][caller()]*/)
        }

        function allowance(address,address) /*public*/ {
            let local2 = 0x4 // #refs 3
            let local3 = sub(calldatasize(), local2) // #refs 0
            require(iszero(lt(local3, 0x40)));
            let local4 = add(0x20, local2) // #refs 0
            mstore(0x20, 0x0)
            let local5 = and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local2)) // #refs -1
            mstore(0x0, local5)
            mstore(0x20, keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/))
            let local6 = and(0xffffffffffffffffffffffffffffffffffffffff, calldataload(local4)) // #refs -1
            mstore(0x0, local6)
            let local7 = [J]0xbb // #refs 0
            let local8 = mload(0x40) // #refs 0
            let local9 = sload(keccak256(0x0, 0x40 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/) // #refs -1
            mstore(local8, local9)
            let local10 = mload(0x40) // #refs 0
            return(local10, sub(add(0x20, local8), local10)) // sload(keccak256(0x0, 0x40 /*calldataload(0x24).keccak256(0x0, 0x40 /*calldataload(0x4).0x0*/)*/)/*base0[calldataload(0x4)][calldataload(0x24)]*/)
        }

    }
}

```
