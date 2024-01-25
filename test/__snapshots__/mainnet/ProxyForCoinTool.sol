// SPDX-License-Identifier: UNLICENSED
contract Contract {

    function() external payable {
        require(delegatecall(gasleft(),0xde8bf93da2f7eecb3d9169422413a9bef4ef628,returndatasize(),msg.data.length,returndatasize(),returndatasize()));
        return memory[returndatasize():(returndatasize()+returndatasize())];
    }

}
