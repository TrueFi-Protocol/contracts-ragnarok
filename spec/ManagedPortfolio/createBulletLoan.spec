import "ManagedPortfolio.spec"

rule createBulletLoanTransfersFundsToBorrower() {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    require borrower != currentContract && borrower != protocolConfig.protocolAddress() && borrower != manager();

    uint256 balance_old = token.balanceOf(borrower);

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 balance_new = token.balanceOf(borrower);

    assert balance_new == balance_old + principalAmount;
}

rule createBulletLoanMintsBulletLoansNFT() {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    uint256 instrumentID = nextIdGhost;

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert bulletLoans.ownerOf(instrumentID) == currentContract;
}

rule createBulletLoanChecksDurationIzGreaterThenZero {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    require loanDuration <= 0;

    env e;
    createBulletLoan@withrevert(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert lastReverted;
}

rule createBulletLoanChecksPrincipalIsGreaterThanRepayment {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    require principalAmount > repaymentAmount;

    env e;
    createBulletLoan@withrevert(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert lastReverted;
}

rule createBulletLoanChecksTimeIsBeforePortfolioEndTime {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    env e;
    require e.block.timestamp > endDate();
    createBulletLoan@withrevert(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert lastReverted;
}

rule createBulletLoanChecksBulletLoanEndTimeIsBeforePortfolioEndTime {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    env e;
    require e.block.timestamp + loanDuration > endDate();
    createBulletLoan@withrevert(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert lastReverted;
}

rule createBulletLoanCreatesBulletLoanWithEndTimeBeforePortfolioEndTime {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    uint256 instrumentID = nextIdGhost;

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert bulletLoans.endDate(instrumentID) <= endDate();
}

rule createBulletLoanChecksCallerIsManager {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    env e;
    require e.msg.sender != manager();
    createBulletLoan@withrevert(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert lastReverted;
}

rule createBulletLoanTransfersFeeToManager {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;
    address _manager = manager();

    require principalAmount > 10000;
    require managerFee() > 0;
    require loanDuration > YEAR();
    require _manager != currentContract && _manager != borrower;

    uint256 managerBalance_old = token.balanceOf(_manager);

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 managerBalance_new = token.balanceOf(_manager);

    assert managerBalance_new > managerBalance_old;
}

rule createBulletLoanTransfersFeeToProtocol {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;
    address protocol = protocolConfig.protocolAddress();

    require principalAmount > 10000;
    require protocolConfig.protocolFee() > 0;
    require loanDuration > YEAR();
    require protocol != currentContract && protocol != borrower;

    uint256 protocolBalance_old = token.balanceOf(protocol);

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 protocolBalance_new = token.balanceOf(protocol);

    assert protocolBalance_new > protocolBalance_old;
}

rule createBulletLoanAddsNewLoanToLoanList {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    uint256 instrumentID = nextIdGhost;
    uint256 loansLength_old = loansLengthGhost;

    require loansLength_old < max_uint256;

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 loansLength_new = loansLengthGhost;

    assert loansLength_new == loansLength_old + 1;
    assert loansGhost[loansLength_old] == instrumentID;
}

rule onlyCreateBulletLoanAddsNewLoanToLoanList(method f) {
    uint256 loansLength_old = loansLengthGhost;

    env e;
    callFunction(f, e);

    uint256 loansLength_new = loansLengthGhost;

    ifEffectThenFunction(
        loansLength_new != loansLength_old,
        f.selector == createBulletLoan(uint256,address,uint256,uint256).selector
    );
    assert true;
}

rule createBulletLoanWithLongDurationIncreasesLatestRepaymentDate {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    env e;

    uint256 latestRepaymentDate_old = latestRepaymentDate();

    require loanDuration > latestRepaymentDate_old - e.block.timestamp;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 latestRepaymentDate_new = latestRepaymentDate();

    assert latestRepaymentDate_new == e.block.timestamp + loanDuration;
    assert latestRepaymentDate_new > latestRepaymentDate_old;
}

rule createBulletLoanWithShortDurationDoesNotChangeLatestRepaymentDate {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    env e;

    uint256 latestRepaymentDate_old = latestRepaymentDate();

    require loanDuration <= latestRepaymentDate_old - e.block.timestamp;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    assert latestRepaymentDate() == latestRepaymentDate_old;
}
