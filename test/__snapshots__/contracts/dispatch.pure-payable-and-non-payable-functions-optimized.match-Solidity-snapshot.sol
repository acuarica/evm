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
