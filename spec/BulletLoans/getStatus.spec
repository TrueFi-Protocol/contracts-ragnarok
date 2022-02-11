import "BulletLoans.spec"

rule newlyCreatedLoanHasIssuedStatus() {
    env e;
    calldataarg args;
    uint256 instrumentID = createLoan(e,args);

    assert getStatus(instrumentID) == LOAN_ISSUED();
}

rule repaidLoanHasFullyRepaidStatus() {
    env e;
    uint256 instrumentID;
    uint256 debtAmount = unpaidDebt(instrumentID);
    uint256 repayAmount;

    require repayAmount >= debtAmount;

    repay(e,instrumentID,repayAmount);

    assert getStatus(instrumentID) == LOAN_FULLY_REPAID();
}

rule onlyRepayOrUpdateLoanParametersChangeStatusToFullyRepaid(method f) {
    uint256 instrumentID;

    require getStatus(instrumentID) != LOAN_FULLY_REPAID();

    env e;
    callFunction(f, e);

    ifEffectThenFunction(
        getStatus(instrumentID) == LOAN_FULLY_REPAID(),
        f.selector == repay(uint256,uint256).selector ||
        f.selector == updateLoanParameters(uint256,uint256,uint256).selector ||
        f.selector == updateLoanParameters(uint256,uint256,uint256,bytes).selector
    );
    assert true;
}

rule nonExistentLoansRevertOnGetStatus() {
    uint256 instrumentID;
    require loanIsUninitialised(instrumentID);

    getStatus@withrevert(instrumentID);

    assert lastReverted;
}

rule markLoanAsDefaultedChangesStatusToDefaulted() {
     uint256 instrumentID;

     env e;
     markLoanAsDefaulted(e, instrumentID);

     assert getStatus(instrumentID) == LOAN_DEFAULTED();
}

rule markLoansAsDefaultedChecksLoanIsNotIssued {
     uint256 instrumentID;

     require getStatus(instrumentID) != LOAN_ISSUED();

     env e;
     markLoanAsDefaulted@withrevert(e, instrumentID);

     assert lastReverted;
}
