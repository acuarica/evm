// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmSTtpm5DBKGuP8jXg7VqFpPvsDdvRg1iu5crDDLnYZTst
pragma solidity 0.8.20;

contract Contract {

    event Transfer(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event Approval(address indexed _arg0, address indexed _arg1, uint256 _arg2);

    mapping (address => unknown) public balanceOf;
    mapping (address => mapping (address => uint256)) mapping2;

    unknown var1__1; // Slot #4
    unknown var2__2; // Slot #2
    unknown var3__3; // Slot #3

    error ERC20InvalidSender(address); // 96c6fd1e
    error ERC20InvalidReceiver(address); // ec442f05
    error ERC20InsufficientBalance(address,uint256,uint256); // e450d38c
    error ERC20InvalidApprover(address); // e602df05
    error ERC20InvalidSpender(address); // 94280d62
    error ERC20InsufficientAllowance(address,uint256,uint256); // fb8f41b2

    fallback() external payable {
        require(msg.value == 0);
        if (msg.data.length >= 0x4) {
            if (0x313ce567 <= msg.data >>> 0xe0) {
                if (msg.sig == 313ce567) {
                    $313ce567();
                } else {
                    if (msg.sig == 70a08231) {
                        $70a08231();
                    } else {
                        if (msg.sig == 95d89b41) {
                            $95d89b41();
                        } else {
                            if (msg.sig == a9059cbb) {
                                $a9059cbb();
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
                            revert();
                        }
                    }
                }
            }
        }
        revert();
    }

    function decimals() public view returns (uint256) {
        return 0x12;
    }

    function balanceOf(address _arg0) public returns (unknown) {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
        return balanceOf[_arg0];
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
                                                                return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                            }
                                                            return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                        }
                                                        return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                    }
                                                    return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                                }
                                                return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                            }
                                            return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                        }
                                        return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                    }
                                    return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                                }
                                return memory[0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20+0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20 + ((var_1 >>> 0x1 & 0x7f) + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x40 - 0x80 + 0x20 + (0x1f + (var_1 >>> 0x1 & 0x7f)) / 0x20 * 0x20)];
                            }
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
        if (msg.sender == 0) {
            revert ERC20InvalidSender(0x0);
        }
        if (_arg0 == 0) {
            revert ERC20InvalidReceiver(0x0);
        }
        if (msg.sender == 0) {
            assert(var_2 <= _arg1 + var_2, 0x11);
            var_2 += _arg1;
            if (_arg0 == 0) {
                var_2 -= _arg1;
                emit Transfer(msg.sender, _arg0, _arg1);
            }
            storage[keccak256(_arg0, 0x0)] += _arg1;
            emit Transfer(msg.sender, _arg0, _arg1);
        }
        if (balanceOf[msg.sender] < _arg1) {
            revert ERC20InsufficientBalance(msg.sender, balanceOf[msg.sender], _arg1);
        }
        balanceOf[msg.sender] -= _arg1;
        if (_arg0 == 0) {
            var_2 -= _arg1;
            emit Transfer(msg.sender, _arg0, _arg1);
        }
        storage[keccak256(_arg0, 0x0)] += _arg1;
        emit Transfer(msg.sender, _arg0, _arg1);
    }

    function allowance(address _arg0, address _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        require(_arg1 == _arg1);
    }

    function name() public {
        if ((var_3 & 0x1) == 0) {
            assert((var_3 & 0x1) - ((var_3 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if ((var_3 & 0x1) == 0) {
                assert((var_3 & 0x1) - ((var_3 >>> 0x1 & 0x7f) < 0x20), 0x22);
                if (var_3 >>> 0x1 & 0x7f) {
                    if (0x1f >= (var_3 >>> 0x1 & 0x7f)) {
                    }
                }
            }
            assert((var_3 & 0x1) - (var_3 >>> 0x1 < 0x20), 0x22);
            if (var_3 >>> 0x1) {
                if (0x1f >= var_3 >>> 0x1) {
                }
            }
        }
        assert((var_3 & 0x1) - (var_3 >>> 0x1 < 0x20), 0x22);
        if ((var_3 & 0x1) == 0) {
            assert((var_3 & 0x1) - ((var_3 >>> 0x1 & 0x7f) < 0x20), 0x22);
            if (var_3 >>> 0x1 & 0x7f) {
                if (0x1f >= (var_3 >>> 0x1 & 0x7f)) {
                }
            }
        }
    }

    function approve(address _arg0, uint256 _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        if (msg.sender == 0) {
            revert ERC20InvalidApprover(0x0);
        }
        if (_arg0 == 0) {
            revert ERC20InvalidSpender(0x0);
        }
        mapping2[msg.sender][_arg0] = _arg1;
        emit Approval(msg.sender, _arg0, _arg1);
    }

    function totalSupply() public {
    }

    function transferFrom(address _arg0, address _arg1, uint256 _arg2) public {
        require(msg.data.length - 0x4 >= 0x60);
        require(_arg0 == _arg0);
        require(_arg1 == _arg1);
        if (mapping2[_arg0][msg.sender] != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) {
            if (mapping2[_arg0][msg.sender] < _arg2) {
                revert ERC20InsufficientAllowance(msg.sender, mapping2[_arg0][msg.sender], _arg2);
            }
            if (_arg0 == 0) {
                revert ERC20InvalidApprover(0x0);
            }
            if (msg.sender == 0) {
                revert ERC20InvalidSpender(0x0);
            }
            mapping2[_arg0][msg.sender] -= _arg2;
            if (_arg0 == 0) {
                revert ERC20InvalidSender(0x0);
            }
            if (_arg1 == 0) {
                revert ERC20InvalidReceiver(0x0);
            }
            if (_arg0 == 0) {
                assert(var_2 <= _arg2 + var_2, 0x11);
                var_2 += _arg2;
                if (_arg1 == 0) {
                    var_2 -= _arg2;
                    emit Transfer(_arg0, _arg1, _arg2);
                }
                storage[keccak256(_arg1, 0x0)] += _arg2;
                emit Transfer(_arg0, _arg1, _arg2);
            }
            if (balanceOf[_arg0] < _arg2) {
                revert ERC20InsufficientBalance(_arg0, balanceOf[_arg0], _arg2);
            }
            balanceOf[_arg0] -= _arg2;
            if (_arg1 == 0) {
                var_2 -= _arg2;
                emit Transfer(_arg0, _arg1, _arg2);
            }
            storage[keccak256(_arg1, 0x0)] += _arg2;
            emit Transfer(_arg0, _arg1, _arg2);
        }
        if (_arg0 == 0) {
        }
        if (_arg1 == 0) {
        }
        if (_arg0 == 0) {
            assert(var_2 <= _arg2 + var_2, 0x11);
            var_2 += _arg2;
            if (_arg1 == 0) {
                var_2 -= _arg2;
                emit Transfer(_arg0, _arg1, _arg2);
            }
            storage[keccak256(_arg1, 0x0)] += _arg2;
            emit Transfer(_arg0, _arg1, _arg2);
        }
        if (balanceOf[_arg0] < _arg2) {
        }
        balanceOf[_arg0] -= _arg2;
        if (_arg1 == 0) {
            var_2 -= _arg2;
            emit Transfer(_arg0, _arg1, _arg2);
        }
        storage[keccak256(_arg1, 0x0)] += _arg2;
    }

}
