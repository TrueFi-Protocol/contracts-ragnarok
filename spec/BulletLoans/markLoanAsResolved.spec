import "BulletLoans.spec"

rule markLoanAsResolvedRevertsOnNonExistent() {
    uint256 instrumentID;
    require loanIsUninitialised(instrumentID);

    env e;
    markLoanAsResolved@withrevert(e, instrumentID);

    assert lastReverted;
}

rule markLoanAsResolvedChecksOwner() {
    uint256 instrumentID;

    env e;
    markLoanAsResolved(e, instrumentID);

    assert e.msg.sender == ownerOf(instrumentID);
}

rule markLoanAsResolvedChecksLoanIsDefaulted(){
    uint256 instrumentID;
    uint8 status_old = getStatus(instrumentID);

    env e;
    markLoanAsResolved(e, instrumentID);

    assert status_old == LOAN_DEFAULTED();
}

rule markLoanAsResolvedChangesStatus(){
    uint256 instrumentID;

    env e;
    markLoanAsResolved(e, instrumentID);

    assert getStatus(instrumentID) == LOAN_RESOLVED();
}

rule onlyMarkLoanAsResolvedCanUndefaultLoan(method f) {
    uint256 instrumentID;
    require getStatus(instrumentID) == LOAN_DEFAULTED();

    env e;
    callFunction(f, e);

    bool statement = getStatus(instrumentID) != LOAN_DEFAULTED();
    ifEffectThenFunction(
        statement,
        f.selector == markLoanAsResolved(uint256).selector
    );
    assert true;
}
