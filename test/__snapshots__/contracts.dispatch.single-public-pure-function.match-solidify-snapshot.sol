// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmbRG22j7gbDPjdV1CEtv6kFLnGjWDq7pJ7erwesLSXgWS
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        require(msg.value == 0);
        if (~(msg.data.length < 0x4)) {
            if (msg.sig == 6d4ce63c) {
                $6d4ce63c();
            } else {
                revert();
            }
        }
        revert();
    }

    function 6d4ce63c() public payable returns (uint256) {
        return 0x1;
    }

}
