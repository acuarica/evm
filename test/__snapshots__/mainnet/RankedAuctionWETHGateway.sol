// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmNWynRG1FV6M9HjHkZPAsxrYBswtLT9Qo3aKEVwyHE4Uk
pragma solidity 0.7.6;

contract Contract {

    event OwnershipTransferred(address indexed _arg0, address indexed _arg1);

    unknown public owner; // Slot #0

    fallback() external payable {
        if (msg.data.length >= 0x4) {
            if (0xb6a5d7de <= msg.data >>> 0xe0) {
                if (msg.sig == b6a5d7de) {
                    $b6a5d7de();
                } else {
                    if (msg.sig == c6cb9a8a) {
                        $c6cb9a8a();
                    } else {
                        if (msg.sig == eed88b8d) {
                            $eed88b8d();
                        } else {
                            if (msg.sig == f2fde38b) {
                                $f2fde38b();
                            } else {
                                revert();
                            }
                        }
                    }
                }
            }
            if (msg.sig == 715018a6) {
                $715018a6();
            } else {
                if (msg.sig == 8da5cb5b) {
                    $8da5cb5b();
                } else {
                    if (msg.sig == a3d5b255) {
                        $a3d5b255();
                    } else {
                        if (msg.sig == ad5c4648) {
                            $ad5c4648();
                        } else {
                            revert();
                        }
                    }
                }
            }
        }
        if (msg.data.length == 0) {
            require(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 == msg.sender, 0x8c379a0, 0x20, 0x2a, this.code[0xbc5:(0xbc5+0x2a)], memory[0xe4]);
            return;
        }
        revert();
    }

    function authorize(address _arg0) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x20);
        require(owner == msg.sender, 0x8c379a0, 0x20, 0x20, this.code[0xb79:(0xb79+0x20)]);
        require(address(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).code.length);
        require(call(gasleft(),local12,0x0,local10,0x20 + 0x20 + 0x4 + memory[0x40] - local10,local10,0x20));
        require(returndatasize() >= 0x20);
        return;
    }

    function c6cb9a8a(/*no signature*/) public payable {
        require(msg.data.length - 0x4 >= 0x80);
        require(address(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).code.length);
        require(call(gasleft(),local10,0x0,local8,0x20 + 0x4 + memory[0x40] - local8,local8,0x20));
        require(returndatasize() >= 0x20);
        require(address(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).code.length);
        require(call(gasleft(),local19,msg.value,local17,memory[0x40] - local17 + 0x4,local17,0x0));
        require(address(_arg0).code.length);
        require(call(gasleft(),local32,0x0,local30,local23 - local30 + 0x64,local30,0x0));
        require(address(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).code.length);
        require(call(gasleft(),local41,0x0,local39,0x20 + 0x4 + memory[0x40] - local39,local39,0x20));
        require(returndatasize() >= 0x20);
        require(address(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).code.length);
        require(call(gasleft(),local53,0x0,local51,0x20 + 0x4 + memory[0x40] - local51,local51,0x20));
        require(returndatasize() >= 0x20);
        require(0x70a0823100000000000000000000000000000000000000000000000000000000 == 0x70a0823100000000000000000000000000000000000000000000000000000000, 0x8c379a0, 0x20, 0x2c, this.code[0xb99:(0xb99+0x2c)], memory[0xe4]);
        return;
    }

    function eed88b8d(/*no signature*/) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x40);
        require(owner == msg.sender, 0x8c379a0, 0x20, 0x20, this.code[0xb79:(0xb79+0x20)]);
        if (returndatasize() != 0x0) {
            require(call(gasleft(),local4 & (0x1 << 0xa0) - 0x1,local5,local15,local10 + local9 - local15,local15,0x0));
            return;
        }
        require(call(gasleft(),local4 & (0x1 << 0xa0) - 0x1,local5,local15,local10 + local9 - local15,local15,0x0), "ETH_TRANSFER_FAILED");
        return;
    }

    function transferOwnership(address _arg0) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x20);
        require(owner == msg.sender, 0x8c379a0, 0x20, 0x20, this.code[0xb79:(0xb79+0x20)]);
        require(_arg0, 0x8c379a0, 0x20, 0x26, this.code[0xb53:(0xb53+0x26)], memory[0xe4]);
        emit OwnershipTransferred(owner, _arg0);
        owner = _arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
        return;
    }

    function renounceOwnership() public {
        require(msg.value == 0);
        require(owner == msg.sender, 0x8c379a0, 0x20, 0x20, this.code[0xb79:(0xb79+0x20)]);
        emit OwnershipTransferred(owner, 0x0);
        owner = 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
        return;
    }

    function owner() public returns (unknown) {
        require(msg.value == 0);
        return owner;
    }

    function a3d5b255(/*no signature*/) public {
        require(msg.value == 0);
        require(msg.data.length - 0x4 >= 0x60);
        require(owner == msg.sender, 0x8c379a0, 0x20, 0x20, this.code[0xb79:(0xb79+0x20)]);
        require(address(_arg0).code.length);
        require(call(gasleft(),local14,0x0,local12,0x20 + 0x20 + 0x4 + memory[0x40] - local12,local12,0x20));
        require(returndatasize() >= 0x20);
        return;
    }

    function WETH() public returns (uint256) {
        require(msg.value == 0);
        return 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2;
    }

}
