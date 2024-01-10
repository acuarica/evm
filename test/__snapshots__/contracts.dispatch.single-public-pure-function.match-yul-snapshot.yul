object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = callvalue() // #refs 0
        require(iszero(callvalue()));
        if (not(lt(calldatasize(), 0x4))) {
            let local1 = shr(calldataload(0x0), 0xe0) // #refs 0
            if (eq(msg.sig, 6d4ce63c)) {
                $6d4ce63c();
            } else {
                let local2 = 0x0 // #refs 0
                revert(local2, local2)
            }
        }
        let local1 = 0x0 // #refs 0
        revert(local1, local1)

        /*public*/ function $6d4ce63c() {
            let local2 = 0x80 // #refs 0
            let local3 = 0x1 // #refs -1
            mstore(local2, local3)
            let local4 = 0x80 // #refs 0
            return(local4, sub(add(0x20, local2), local4))
        }

    }
}
