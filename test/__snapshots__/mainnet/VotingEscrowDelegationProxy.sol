// SPDX-License-Identifier: UNLICENSED
contract Contract {

    event 963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212;
    event 8f5425b30e6270c1011973f0ccf6d7795cc10623631523e4c45d2837d337d574;
    event e8d7597c306457cd1fa4eb0e165a1a4c3aea9808e274ea97c6b5d9f73a3c477f;

    uint256 public delegation; // Slot #0
    unknown var2__2; // Slot #2
    unknown var3__3; // Slot #1
    unknown var4__4; // Slot #4
    unknown var5__5; // Slot #3

    function() external payable {
        require(msg.data.length >= 0x4);
        if (~msg.value) {
            if (msg.sig == bbf7408a) {
                $bbf7408a();
            } else {
                if (msg.sig == 4b74efb7) {
                    $4b74efb7();
                } else {
                    if (msg.sig == f4b446a3) {
                        $f4b446a3();
                    } else {
                        if (msg.sig == e3a8d3ab) {
                            $e3a8d3ab();
                        } else {
                            if (msg.sig == 61893921) {
                                $61893921();
                            } else {
                                if (msg.sig == df5cf723) {
                                    $df5cf723();
                                } else {
                                    if (msg.sig == 680c7783) {
                                        $680c7783();
                                    } else {
                                        if (msg.sig == 47c8715f) {
                                            $47c8715f();
                                        } else {
                                            if (msg.sig == 5866507a) {
                                                $5866507a();
                                            } else {
                                                if (msg.sig == 3c2fcbf4) {
                                                    $3c2fcbf4();
                                                } else {
                                                    revert();
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        revert();
    }

    function 61893921() public payable {
        require(msg.sender == var_2, memory[0x15c], memory[0x17c], memory[0x19c], memory[0x1bc]);
        var_2 = var_4;
        var_3 = var_5;
        log(0xe8d7597c306457cd1fa4eb0e165a1a4c3aea9808e274ea97c6b5d9f73a3c477f, var_4, var_5);
        return;
    }

    function bbf7408a() public payable returns (unknown) {
        if (~(_arg0 >>> 0xa0)) {
            if (~delegation) {
                if (~staticcall(gasleft(),0xa9337caea9cf6930cdc576789a8258365c38adbc,0x17c,0x24,0x1e0,0x20) == 0) {
                    if (~(returndatasize() <= 0x1f)) {
                        return memory[0x1e0];
                    }
                    revert();
                }
                revert();
            }
            if (~staticcall(gasleft(),memory[0x140],0x17c,0x24,0x1e0,0x20) == 0) {
                if (~(returndatasize() <= 0x1f)) {
                    return memory[0x1e0];
                }
                revert();
            }
            revert();
        }
        revert();
    }

    function 4b74efb7() public payable {
        if (~msg.sender != var_2) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        require(0x2 != 0x1);
        if (~msg.sender != var_3) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        require(0x2 != 0x2);
        if (~msg.sender != memory[0x1a0]) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        require(0x2 != 0x3);
        if (~msg.sender != memory[0x1c0]) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        require(0x2 != 0x4);
        if (~msg.sender != memory[0x1e0]) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        require(0x2 != 0x5);
        if (~msg.sender != memory[0x200]) {
            delegation = 0x0;
            log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, 0x0);
            return;
        }
        if (~0x2 != 0x6) {
        }
        if (~msg.sender != memory[0x220]) {
        }
        if (~0x2 != 0x7) {
        }
        if (~msg.sender != memory[0x240]) {
        }
        if (~0x2 != 0x8) {
        }
        if (~msg.sender != memory[0x260]) {
        }
        if (~0x2 != 0x9) {
        }
        if (~msg.sender != memory[0x280]) {
        }
        if (~0x2 != 0xa) {
        }
        if (~msg.sender != memory[0x2a0]) {
        }
        if (~0x2 != 0xb) {
        }
    }

    function f4b446a3() public payable {
        if (~(_arg0 >>> 0xa0)) {
            if (~msg.sender != var_2) {
                if (~staticcall(gasleft(),_arg0,0x15c,0x24,0x1c0,0x20) == 0) {
                    if (~(returndatasize() <= 0x1f)) {
                        delegation = _arg0;
                        log(0x963001cf3a0c5cdcfc26b2710abe2fe859b3565482158b7cb34f59b6eaff5212, _arg0);
                        return;
                    }
                }
            }
        }
    }

    function e3a8d3ab() public payable {
        if (~(_arg0 >>> 0xa0)) {
            if (~(_arg1 >>> 0xa0)) {
                require(msg.sender == var_2, memory[0x15c], memory[0x17c], memory[0x19c], memory[0x1bc]);
                var_4 = _arg0;
                var_5 = _arg1;
                log(0x8f5425b30e6270c1011973f0ccf6d7795cc10623631523e4c45d2837d337d574, _arg0, _arg1);
                return;
            }
        }
    }

    function delegation() public view payable returns (unknown) {
        return delegation;
    }

    function 680c7783() public view payable returns (unknown) {
        return var_3;
    }

    function 47c8715f() public view payable returns (unknown) {
        return var_2;
    }

    function 5866507a() public view payable returns (unknown) {
        return var_5;
    }

    function 3c2fcbf4() public view payable returns (unknown) {
        return var_4;
    }

}
