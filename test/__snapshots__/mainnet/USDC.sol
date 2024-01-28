// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmVH44HYS7Kxd5z769QYrhS9tzM4cYcXAeq1h6wcEBEqVK
pragma solidity 0.6.12;

contract Contract {

    event AdminChanged(address _arg0, address _arg1);
    event Upgraded(address _arg0);

    address public admin; // Slot #7616251639890160809447714111544359812065171195189364993079081710756264753419
    address public implementation; // Slot #50801780122331352337026042894847907698553222651959119521779622085092237899971

    fallback() external payable {
        if (msg.data.length >= 0x4) {
            if (0x5c60da1b <= msg.data >>> 0xe0) {
                if (msg.sig == 5c60da1b) {
                    $5c60da1b();
                } else {
                    if (msg.sig == 8f283970) {
                        $8f283970();
                    } else {
                        if (msg.sig == f851a440) {
                            $f851a440();
                        } else {
                            require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
                            if (delegatecall(gasleft(),implementation,0x0,msg.data.length,0x0,0x0)) {
                                return memory[0x0:(0x0+returndatasize())];
                            }
                            revert(memory[0x0:(0x0+returndatasize())]);
                        }
                    }
                }
            }
            if (msg.sig == 3659cfe6) {
                $3659cfe6();
            } else {
                if (msg.sig == 4f1ef286) {
                    $4f1ef286();
                } else {
                    require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
                    if (delegatecall(gasleft(),implementation,0x0,msg.data.length,0x0,0x0)) {
                        return memory[0x0:(0x0+returndatasize())];
                    }
                    revert(memory[0x0:(0x0+returndatasize())]);
                }
            }
        }
        require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
        if (delegatecall(gasleft(),implementation,0x0,msg.data.length,0x0,0x0)) {
            return memory[0x0:(0x0+returndatasize())];
        }
        revert(memory[0x0:(0x0+returndatasize())]);
    }

    function implementation() public returns (unknown) {
        require(msg.value == 0);
        return implementation;
    }

    function changeAdmin(address _arg0) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x20);
        if (msg.sender == admin) {
            require(_arg0, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
            emit AdminChanged(admin, _arg0);
            admin = _arg0;
            return;
        }
        require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
        if (delegatecall(gasleft(),implementation,0x0,msg.data.length,0x0,0x0)) {
            return memory[0x0:(0x0+returndatasize())];
        }
        revert(memory[0x0:(0x0+returndatasize())]);
    }

    function admin() public returns (unknown) {
        require(msg.value == 0);
        return admin;
    }

    function upgradeTo(address _arg0) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x20);
        if (msg.sender == admin) {
            if (0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 != keccak256(address(_arg0).code)) {
                require(keccak256(address(_arg0).code), 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
                implementation = _arg0;
                emit Upgraded(_arg0);
                return;
            }
            require(0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 != keccak256(address(_arg0).code), 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
            implementation = _arg0;
            emit Upgraded(_arg0);
            return;
        }
        require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
        if (delegatecall(gasleft(),implementation,0x0,msg.data.length,0x0,0x0)) {
            return memory[0x0:(0x0+returndatasize())];
        }
        revert(memory[0x0:(0x0+returndatasize())]);
    }

    function upgradeToAndCall(address _arg0, bytes _arg1) public payable {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg1 <= 0x100000000);
        require(0x4 + _arg1 + 0x20 <= 0x4 + msg.data.length - 0x4);
        require((msg.data[0x4 + _arg1] > 0x100000000 | 0x20 + 0x4 + _arg1 + msg.data[0x4 + _arg1] * 0x1 > 0x4 + msg.data.length - 0x4) == 0);
        if (msg.sender == admin) {
            if (0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 != keccak256(address(_arg0).code)) {
                require(keccak256(address(_arg0).code), 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
                implementation = _arg0;
                emit Upgraded(_arg0);
                if (returndatasize() != 0x0) {
                    require(call(gasleft(),0xffffffffffffffffffffffffffffffffffffffff & address(this),msg.value,local16,local15 + local6 - local16,local16,0x0));
                    return;
                }
                require(call(gasleft(),0xffffffffffffffffffffffffffffffffffffffff & address(this),msg.value,local16,local15 + local6 - local16,local16,0x0));
                return;
            }
            require(0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 != keccak256(address(_arg0).code), 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
            implementation = _arg0;
            emit Upgraded(_arg0);
            if (returndatasize() != 0x0) {
                require(call(gasleft(),0xffffffffffffffffffffffffffffffffffffffff & address(this),msg.value,local16,local15 + local6 - local16,local16,0x0));
                return;
            }
            require(call(gasleft(),0xffffffffffffffffffffffffffffffffffffffff & address(this),msg.value,local16,local15 + local6 - local16,local16,0x0));
            return;
        }
        require(msg.sender != admin, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0], memory[0x100]);
    }

}
