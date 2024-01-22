// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmQQStsWnf4bGx7hCasn3pQte2a6rz79QfbprYrQT3h6ec
pragma solidity 0.8.17;

contract Contract {

    fallback() external payable {
        require(msg.value == 0);
        if (~(msg.data.length < 0x4)) {
            if (msg.sig == f7e83aee) {
                $f7e83aee();
            } else {
                revert();
            }
        }
        revert();
    }

    function verify(bytes _arg0, bytes _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 <= 0xffffffffffffffff);
        require(0x4 + _arg0 + 0x1f < msg.data.length);
        require(msg.data[0x4 + _arg0] <= 0xffffffffffffffff);
        require(0x4 + _arg0 + msg.data[0x4 + _arg0] + 0x20 <= msg.data.length);
        require(_arg1 <= 0xffffffffffffffff);
        require(0x4 + _arg1 + 0x1f < msg.data.length);
        require(msg.data[0x4 + _arg1] <= 0xffffffffffffffff);
        require(0x4 + _arg1 + msg.data[0x4 + _arg1] + 0x20 <= msg.data.length);
        require(msg.data[0x4 + _arg1] == 0x14, 0x8c379a000000000000000000000000000000000000000000000000000000000, memory[0xa0], memory[0xc0], memory[0xe0]);
        require(0x14 <= msg.data[0x4 + _arg1]);
        if (~(((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 - memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x9) - 0x1)) {
            if (~(0x0 >= (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40)) {
                if (~(0x0 >= memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20])) {
                    if (~(memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] >= 0x20)) {
                        if (~(0x20 >= memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20])) {
                            if (~(memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] - 0x20 >= 0x20)) {
                                if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                                    if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                                    }
                                }
                                if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                                }
                            }
                            if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                                if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                                }
                            }
                            if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                            }
                        }
                        if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                            if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                            }
                        }
                        if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                        }
                    }
                    if (~(0x20 >= memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20])) {
                        if (~(memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] - 0x20 >= 0x20)) {
                            if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                                if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                                }
                            }
                            if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                            }
                        }
                        if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                            if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                            }
                        }
                        if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                        }
                    }
                    if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                        if (~((0x0 == (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40 + 0x40 - 0x40) - 0x1)) {
                        }
                    }
                }
                if (~(0x20 >= memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20])) {
                    if (~(memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] - 0x20 >= 0x20)) {
                        if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                        }
                    }
                    if (~((memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] < 0x40) - 0x1)) {
                    }
                }
            }
            return memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20+0x20 + 0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20)];
        }
        if (~(0x0 >= (memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] + 0x1 & 0xffffffffffffffc0) + 0x40)) {
            if (~(0x0 >= memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20])) {
                if (~(memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20] >= 0x20)) {
                }
            }
        }
        return memory[0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20:(0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20+0x20 + 0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20 - 0x80 + 0x20 + (0x1f + msg.data[0x4 + _arg1]) / 0x20 * 0x20 + 0x20 + (0x1f + msg.data[0x4 + _arg0]) / 0x20 * 0x20)];
    }

}
