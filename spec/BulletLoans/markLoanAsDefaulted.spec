import "BulletLoans.spec"

rule cantMarkLoanAsDefaultedIfUninitialized() {
    uint256 instrumentID;

    require loanIsUninitialised(instrumentID);

    env e;
    markLoanAsDefaulted@withrevert(e, instrumentID);

    assert lastReverted;
}

rule revertsIfMarkLoanAsDefaultedCallerIsNotAnOwner() {
    uint256 instrumentID;

    env e;
    require e.msg.sender != ownerOf(instrumentID);
    markLoanAsDefaulted@withrevert(e, instrumentID);
    assert lastReverted;
}

rule cantMarkLoanAsDefaultedTwice() {
    uint256 instrumentID;

    env e1;
    markLoanAsDefaulted(e1, instrumentID);

    env e2;
    markLoanAsDefaulted@withrevert(e2, instrumentID);
    assert lastReverted;
}
