import "ManagedPortfolio.spec"

rule markLoanAsDefaultedChangesLoanStatusToDefaulted(method f) {
    uint256 instrumentID;

    env e;
    markLoanAsDefaulted(e, instrumentID);

    assert bulletLoans.getStatus(instrumentID) == LOAN_DEFAULTED();
}

rule onlyMarkLoanAsDefaultedChangesLoanStatusToDefaulted(method f) {
    uint256 instrumentID;

    require bulletLoans.getStatus(instrumentID) != LOAN_DEFAULTED();

    env e;
    callFunction(f, e);

    bool statement = bulletLoans.getStatus(instrumentID) == LOAN_DEFAULTED();
    ifEffectThenFunction(
        statement,
        f.selector == markLoanAsDefaulted(uint256).selector
    );

    assert true;
}

rule markLoanAsDefaultedChecksLoanIsIssued() {
   uint256 instrumentID;

   require bulletLoans.getStatus(instrumentID) != LOAN_ISSUED();

   env e;
   markLoanAsDefaulted@withrevert(e, instrumentID);

   assert lastReverted;
}

rule markLoanAsDefaultedIncreasesDefaultedLoansCount() {
    uint256 defaultedLoansCount_old = defaultedLoansCount();

    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    uint256 instrumentID = nextIdGhost;

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    markLoanAsDefaulted(e, instrumentID);

    assert defaultedLoansCount_old + 1 == defaultedLoansCount();
}
