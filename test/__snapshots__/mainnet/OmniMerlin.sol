// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmPCGgj5Xz1ZhCiJXovrh4XEytvUkYDWxXjKr5hQnMxkZN
pragma solidity 0.8.13;

contract Contract {

    event Transfer(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event Approval(address indexed _arg0, address indexed _arg1, uint256 _arg2);

    mapping (address => unknown) public balanceOf;
    mapping (address => mapping (address => uint256)) mapping2;
    mapping (address => unknown) public nonces;

    unknown var1__1; // Slot #1
    unknown var2__2; // Slot #0
    unknown var3__3; // Slot #2

    fallback() external payable {
        require(msg.value == 0);
        if (msg.data.length >= 0x4) {
            if (0x70a08231 <= msg.data >>> 0xe0) {
                if (msg.sig == 70a08231) {
                    $70a08231();
                } else {
                    if (msg.sig == 7ecebe00) {
                        $7ecebe00();
                    } else {
                        if (msg.sig == 95d89b41) {
                            $95d89b41();
                        } else {
                            if (msg.sig == a9059cbb) {
                                $a9059cbb();
                            } else {
                                if (msg.sig == d505accf) {
                                    $d505accf();
                                } else {
                                    if (msg.sig == dd62ed3e) {
                                        $dd62ed3e();
                                    } else {
                                        revert();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (msg.sig == 06fdde03) {
                $06fdde03();
            } else {
                if (msg.sig == 095ea7b3) {
                    $095ea7b3();
                } else {
                    if (msg.sig == 18160ddd) {
                        $18160ddd();
                    } else {
                        if (msg.sig == 23b872dd) {
                            $23b872dd();
                        } else {
                            if (msg.sig == 313ce567) {
                                $313ce567();
                            } else {
                                if (msg.sig == 3644e515) {
                                    $3644e515();
                                } else {
                                    revert();
                                }
                            }
                        }
                    }
                }
            }
        }
        revert();
    }

    function balanceOf(address _arg0) public returns (unknown) {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
        return balanceOf[_arg0];
    }

    function nonces(address _arg0) public returns (unknown) {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
        return nonces[_arg0];
    }

    function symbol() public {
        if ((var_1 & 0x1) == 0) {
            assert((var_1 & 0x1) - ((var_1 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if ((var_1 & 0x1) == 0) {
                assert((var_1 & 0x1) - ((var_1 >>> 0x1 & 0x7f) < 0x20), 0x22);
                if (var_1 >>> 0x1 & 0x7f) {
                    if (0x1f >= (var_1 >>> 0x1 & 0x7f)) {
                        if (0x0 < (var_1 >>> 0x1 & 0x7f)) {
                            if (0x20 < (var_1 >>> 0x1 & 0x7f)) {
                                if (0x40 < (var_1 >>> 0x1 & 0x7f)) {
                                    if (0x60 < (var_1 >>> 0x1 & 0x7f)) {
                                        if (0x80 < (var_1 >>> 0x1 & 0x7f)) {
                                            if (0xa0 < (var_1 >>> 0x1 & 0x7f)) {
                                                if (0xc0 < (var_1 >>> 0x1 & 0x7f)) {
                                                    if (0xe0 < (var_1 >>> 0x1 & 0x7f)) {
                                                        if (0x100 < (var_1 >>> 0x1 & 0x7f)) {
                                                            if (0x120 < (var_1 >>> 0x1 & 0x7f)) {
                                                                if (0x140 < (var_1 >>> 0x1 & 0x7f)) {
                                                                }
                                                                if (0x140 > (var_1 >>> 0x1 & 0x7f)) {
                                                                    return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                                }
                                                                return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                            }
                                                            if (0x120 > (var_1 >>> 0x1 & 0x7f)) {
                                                                return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                            }
                                                            return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                        }
                                                        if (0x100 > (var_1 >>> 0x1 & 0x7f)) {
                                                            return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                        }
                                                        return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                    }
                                                    if (0xe0 > (var_1 >>> 0x1 & 0x7f)) {
                                                        return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                    }
                                                    return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                }
                                                if (0xc0 > (var_1 >>> 0x1 & 0x7f)) {
                                                    return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x40 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + (var_1 >>> 0x1 & 0x7f)) + 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                }
                                            }
                                            if (0xa0 > (var_1 >>> 0x1 & 0x7f)) {
                                            }
                                        }
                                        if (0x80 > (var_1 >>> 0x1 & 0x7f)) {
                                        }
                                    }
                                    if (0x60 > (var_1 >>> 0x1 & 0x7f)) {
                                    }
                                }
                                if (0x40 > (var_1 >>> 0x1 & 0x7f)) {
                                }
                            }
                            if (0x20 > (var_1 >>> 0x1 & 0x7f)) {
                            }
                        }
                        if (0x0 > (var_1 >>> 0x1 & 0x7f)) {
                        }
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0xc0) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0xe0) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x100) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x120) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x140) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x160) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x180) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x1a0) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x1c0) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x1e0) {
                    }
                    if (0xa0 + (var_1 >>> 0x1 & 0x7f) <= 0x200) {
                    }
                }
            }
            assert((var_1 & 0x1) - (var_1 >>> 0x1 < 0x20), 0x22);
            if (var_1 >>> 0x1) {
                if (0x1f >= var_1 >>> 0x1) {
                }
            }
        }
        assert((var_1 & 0x1) - (var_1 >>> 0x1 < 0x20), 0x22);
        if ((var_1 & 0x1) == 0) {
            assert((var_1 & 0x1) - ((var_1 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if (var_1 >>> 0x1 & 0x7f) {
                if (0x1f >= (var_1 >>> 0x1 & 0x7f)) {
                }
            }
        }
        assert((var_1 & 0x1) - (var_1 >>> 0x1 < 0x20), 0x22);
        if (var_1 >>> 0x1) {
            if (0x1f >= var_1 >>> 0x1) {
            }
        }
    }

    function transfer(address _arg0, uint256 _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        assert(storage[keccak256(msg.sender, 0x3)] >= _arg1, 0x11);
        storage[keccak256(msg.sender, 0x3)] -= _arg1;
        storage[keccak256(_arg0, 0x3)] += _arg1;
        emit Transfer(msg.sender, _arg0, _arg1);
    }

    function d505accf(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0xe0);
        require(_arg0 == _arg0);
        require(_arg1 == _arg1);
        require(_arg4 == _arg4);
        require(_arg3 >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");
        if (block.chainid != 0x1) {
            if ((var_2 & 0x1) == 0) {
                assert((var_2 & 0x1) - ((var_2 >>> 0x1 & 0x7f) < 0x20), 0x22);
                if (var_2 & 0x1) {
                    if ((var_2 & 0x1) != 0x1) {
                        throw('Memory size too large creating Sha3: 115792089237316195423570985008687907853269984665640564039457584007913129639808 in `sub(local12, local21)`');
                    }
                    if (0x0 < (var_2 >>> 0x1 & 0x7f)) {
                        if (0x20 < (var_2 >>> 0x1 & 0x7f)) {
                            if (0x40 < (var_2 >>> 0x1 & 0x7f)) {
                                if (0x60 < (var_2 >>> 0x1 & 0x7f)) {
                                    if (0x80 < (var_2 >>> 0x1 & 0x7f)) {
                                        if (0xa0 < (var_2 >>> 0x1 & 0x7f)) {
                                            if (0xc0 < (var_2 >>> 0x1 & 0x7f)) {
                                                if (0xe0 < (var_2 >>> 0x1 & 0x7f)) {
                                                    if (0x100 < (var_2 >>> 0x1 & 0x7f)) {
                                                        if (0x120 < (var_2 >>> 0x1 & 0x7f)) {
                                                            if (0x140 < (var_2 >>> 0x1 & 0x7f)) {
                                                            }
                                                            storage[keccak256(_arg0, 0x5)] += 0x1;
                                                            require(staticcall(gasleft(),0x1,local65,0xa0 + local60 - local65,local65 - 0x20,0x20));
                                                            revert("INVALID_SIGNER");
                                                        }
                                                        storage[keccak256(_arg0, 0x5)] += 0x1;
                                                        require(staticcall(gasleft(),0x1,local63,0xa0 + local58 - local63,local63 - 0x20,0x20));
                                                        revert("INVALID_SIGNER");
                                                    }
                                                    storage[keccak256(_arg0, 0x5)] += 0x1;
                                                    require(staticcall(gasleft(),0x1,local61,0xa0 + local56 - local61,local61 - 0x20,0x20));
                                                    revert("INVALID_SIGNER");
                                                }
                                                storage[keccak256(_arg0, 0x5)] += 0x1;
                                                require(staticcall(gasleft(),0x1,local59,0xa0 + local54 - local59,local59 - 0x20,0x20));
                                                revert("INVALID_SIGNER");
                                            }
                                            storage[keccak256(_arg0, 0x5)] += 0x1;
                                            require(staticcall(gasleft(),0x1,local57,0xa0 + local52 - local57,local57 - 0x20,0x20));
                                            revert("INVALID_SIGNER");
                                        }
                                        storage[keccak256(_arg0, 0x5)] += 0x1;
                                        require(staticcall(gasleft(),0x1,local55,0xa0 + local50 - local55,local55 - 0x20,0x20));
                                        revert("INVALID_SIGNER");
                                    }
                                    storage[keccak256(_arg0, 0x5)] += 0x1;
                                    require(staticcall(gasleft(),0x1,local53,0xa0 + local48 - local53,local53 - 0x20,0x20));
                                    revert("INVALID_SIGNER");
                                }
                                storage[keccak256(_arg0, 0x5)] += 0x1;
                                require(staticcall(gasleft(),0x1,local51,0xa0 + local46 - local51,local51 - 0x20,0x20));
                                revert("INVALID_SIGNER");
                            }
                            storage[keccak256(_arg0, 0x5)] += 0x1;
                            require(staticcall(gasleft(),0x1,local49,0xa0 + local44 - local49,local49 - 0x20,0x20));
                            revert("INVALID_SIGNER");
                        }
                        storage[keccak256(_arg0, 0x5)] += 0x1;
                        require(staticcall(gasleft(),0x1,local47,0xa0 + local42 - local47,local47 - 0x20,0x20));
                        revert("INVALID_SIGNER");
                    }
                }
            }
            assert((var_2 & 0x1) - (var_2 >>> 0x1 < 0x20), 0x22);
            if (var_2 & 0x1) {
                if ((var_2 & 0x1) != 0x1) {
                }
            }
        }
        storage[keccak256(_arg0, 0x5)] += 0x1;
        require(staticcall(gasleft(),0x1,local30,0xa0 + local25 - local30,local30 - 0x20,0x20));
    }

    function allowance(address _arg0, address _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        require(_arg1 == _arg1);
    }

    function name() public {
        if ((var_2 & 0x1) == 0) {
            assert((var_2 & 0x1) - ((var_2 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if ((var_2 & 0x1) == 0) {
                assert((var_2 & 0x1) - ((var_2 >>> 0x1 & 0x7f) < 0x20), 0x22);
                if (var_2 >>> 0x1 & 0x7f) {
                    if (0x1f >= (var_2 >>> 0x1 & 0x7f)) {
                    }
                }
            }
            assert((var_2 & 0x1) - (var_2 >>> 0x1 < 0x20), 0x22);
            if (var_2 >>> 0x1) {
                if (0x1f >= var_2 >>> 0x1) {
                }
            }
        }
        assert((var_2 & 0x1) - (var_2 >>> 0x1 < 0x20), 0x22);
        if ((var_2 & 0x1) == 0) {
            assert((var_2 & 0x1) - ((var_2 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if (var_2 >>> 0x1 & 0x7f) {
                if (0x1f >= (var_2 >>> 0x1 & 0x7f)) {
                }
            }
        }
    }

    function approve(address _arg0, uint256 _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        mapping5[msg.sender][_arg0] = _arg1;
        emit Approval(msg.sender, _arg0, _arg1);
    }

    function totalSupply() public {
    }

    function transferFrom(address _arg0, address _arg1, uint256 _arg2) public {
        require(msg.data.length - 0x4 >= 0x60);
        require(_arg0 == _arg0);
        require(_arg1 == _arg1);
        if (mapping5[_arg0][msg.sender] != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) {
            assert(mapping5[_arg0][msg.sender] >= _arg2, 0x11);
            mapping5[_arg0][msg.sender] -= _arg2;
            assert(storage[keccak256(_arg0, 0x3)] >= _arg2, 0x11);
            storage[keccak256(_arg0, 0x3)] -= _arg2;
            storage[keccak256(_arg1, 0x3)] += _arg2;
            emit Transfer(_arg0, _arg1, _arg2);
        }
        assert(storage[keccak256(_arg0, 0x3)] >= _arg2, 0x11);
        storage[keccak256(_arg0, 0x3)] -= _arg2;
        storage[keccak256(_arg1, 0x3)] += _arg2;
        emit Transfer(_arg0, _arg1, _arg2);
    }

    function decimals() public {
    }

    function DOMAIN_SEPARATOR() public {
        if (block.chainid != 0x1) {
            if ((var_2 & 0x1) == 0) {
                assert((var_2 & 0x1) - ((var_2 >>> 0x1 & 0x7f) < 0x20), 0x22);
                if (var_2 & 0x1) {
                    if ((var_2 & 0x1) != 0x1) {
                    }
                }
            }
            assert((var_2 & 0x1) - (var_2 >>> 0x1 < 0x20), 0x22);
            if (var_2 & 0x1) {
                if ((var_2 & 0x1) != 0x1) {
                }
            }
        }
    }

}
