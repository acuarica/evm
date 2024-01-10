object "runtime" {
    code {
        mstore(0x40, 0x80)
        if (not(lt(calldatasize(), 0x4))) {
            let local0 = shr(calldataload(0x0), 0xe0) // #refs 1
            if (eq(msg.sig, 5d2c7ee6)) {
                $5d2c7ee6();
            } else {
                if (eq(msg.sig, 6d4ce63c)) {
                    $6d4ce63c();
                } else {
                    let local1 = 0x0 // #refs 0
                    revert(local1, local1)
                }
            }
        }
        let local0 = 0x0 // #refs 0
        revert(local0, local0)

        /*public*/ function $5d2c7ee6() {
            let local1 = 0x40 // #refs 0
            let local2 = 0x80 // #refs -1
            mstore(local2, 0x1)
            let local3 = 0x80 // #refs 0
            return(local3, add(0x20, sub(local2, local3)))
        }

        /*public*/ function $6d4ce63c() {
            let local1 = callvalue() // #refs 0
            require(iszero(local1));
            let local2 = 0x40 // #refs 0
            let local3 = 0x80 // #refs -1
            mstore(local3, 0x1)
            let local4 = 0x80 // #refs 0
            return(local4, add(0x20, sub(local3, local4)))
        }

    }
}
