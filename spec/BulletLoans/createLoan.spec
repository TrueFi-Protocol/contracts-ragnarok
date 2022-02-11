import "BulletLoans.spec"

rule assignsInstrumentIDsSequentially() {
    env e1;
    calldataarg args1;
    uint256 instrumentID1 = createLoan(e1, args1);

    env e2;
    calldataarg args2;
    uint256 instrumentID2 = createLoan(e2, args2);

    assert instrumentID1 + 1 == instrumentID2;
}

rule onlyCreateLoanIncreasesNextID(method f) {
    uint256 nextId_old = nextIdGhost;

    env e;
    callFunction(f, e);

    uint256 nextId_new = nextIdGhost;

    ifEffectThenFunction(
        nextId_new != nextId_old,
        f.selector == createLoan(address,uint256,uint256,uint256,address).selector
    );
    assert true;
}

rule mintsTokenToTheCaller() {
    env e;
    calldataarg args;
    uint256 instrumentID = createLoan(e, args);

    assert ownerOf(instrumentID) == e.msg.sender;
}
