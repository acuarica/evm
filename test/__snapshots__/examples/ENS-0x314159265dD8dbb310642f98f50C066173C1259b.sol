// SPDX-License-Identifier: UNLICENSED
contract Contract {

    function() external payable {
        if (~msg.sig == 0178b8bf == 0) {
            return storage[_arg0];
        }
        if (~msg.sig == 02571be3 == 0) {
            return storage[_arg0 + 0x20];
        }
        if (~msg.sig == 16a25cbd == 0) {
            return storage[_arg0 + 0x40];
        }
        if (~msg.sig == 5b0fc9c3 == 0) {
            if (~(msg.sender == storage[_arg0 + 0x20])) {
                throw('JUMP(0x56)@142 destination should be JUMPDEST@2 but found '0x78'');
            }
            storage[_arg0 + 0x20] = _arg1;
            log(keccak256(this.code[0x201:(0x201+0x19)]), _arg0, _arg1);
            return;
        }
        if (~msg.sig == 06ab5923 == 0) {
            if (~(msg.sender == storage[_arg0 + 0x20])) {
                throw('JUMP(0x56)@219 destination should be JUMPDEST@2 but found '0x78'');
            }
            storage[keccak256(_arg0, _arg1) + 0x20] = _arg2;
            log(keccak256(this.code[0x1e0:(0x1e0+0x21)], _arg1), _arg0, _arg1, _arg2);
            return;
        }
        if (~msg.sig == 1896f70a == 0) {
            if (~(msg.sender == storage[_arg0 + 0x20])) {
                throw('JUMP(0x56)@313 destination should be JUMPDEST@2 but found '0x78'');
            }
            storage[_arg0] = _arg1;
            log(keccak256(this.code[0x1c4:(0x1c4+0x1c)]), _arg0, _arg1);
            return;
        }
        if (~msg.sig == 14ab9038 == 0) {
            if (~(msg.sender == storage[_arg0 + 0x20])) {
                throw('JUMP(0x56)@387 destination should be JUMPDEST@2 but found '0x78'');
            }
            storage[_arg0 + 0x40] = _arg1;
            log(keccak256(this.code[0x1ae:(0x1ae+0x16)]), _arg0, _arg1);
            return;
        }
        throw('JUMP(0x56)@429 destination should be JUMPDEST@2 but found '0x78'');
    }

}
