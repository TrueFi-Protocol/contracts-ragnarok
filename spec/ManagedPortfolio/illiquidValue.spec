import "ManagedPortfolio.spec"

definition illiquidValueIsZeroWithNoLoansDefinition(env e) returns bool = (loansLengthGhost == 0) => (illiquidValue(e) == 0);

rule illiquidValueIsZeroWithNoLoans() {
    require loansLengthGhost <= 5;

    env e;
    assert illiquidValueIsZeroWithNoLoansDefinition(e);
}

rule illiquidValueIncreasesWhenIssuingLoans() {
    uint256 loanDuration;
    uint256 principalAmount;
    uint256 repaymentAmount;
    address borrower;
    require borrower != currentContract;
    require manager() != currentContract;
    require loansLengthGhost == 0;

    uint256 timestamp;
    env e1;
    require e1.block.timestamp == timestamp;
    uint256 illiquidValue_old = illiquidValue(e1);

    env e2;
    require e2.block.timestamp == timestamp;
    createBulletLoan(e2, loanDuration, borrower, principalAmount, repaymentAmount);

    env e3;
    require e3.block.timestamp == timestamp;
    uint256 illiquidValue_new = illiquidValue(e3);

    assert illiquidValue_old + principalAmount == illiquidValue_new;
}

rule illiquidValueIsConstantWhenOverdue() {
    require loansLengthGhost == 0;
    require manager() != currentContract;

    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;
    require borrower != currentContract;

    env e1;
    createBulletLoan(e1, loanDuration, borrower, principalAmount, repaymentAmount);

    mathint repaymentTimestamp = e1.block.timestamp + loanDuration;

    env e2;
    require e2.block.timestamp >= repaymentTimestamp;
    assert illiquidValue(e2) == repaymentAmount;
}

rule illiquidValueDecreasesWhenLoansPartiallyRepaid() {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;
    require borrower != currentContract;
    require loansLengthGhost == 0;
    require manager() != currentContract;

    env e1;
    require e1.msg.sender != currentContract;
    createBulletLoan(e1, loanDuration, borrower, principalAmount, repaymentAmount);

    env e2;
    uint256 illiquidValue_old = illiquidValue(e2);

    uint256 instrumentID = loansGhost[0];
    uint256 amount;
    require amount <= principalAmount;
    bulletLoans.repay(e2, instrumentID, amount);

    uint256 illiquidValue_new = illiquidValue(e2);

    assert illiquidValue_new + amount == illiquidValue_old;
}

rule illiquidValueDecreasesWhenLoansFullyRepaid() {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;
    require borrower != currentContract;
    require loansLengthGhost == 0;
    require manager() != currentContract;

    env e1;
    require e1.msg.sender != currentContract;
    createBulletLoan(e1, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 instrumentID = loansGhost[0];
    uint256 amount;
    require amount >= repaymentAmount;

    env e2;
    bulletLoans.repay(e2, instrumentID, amount);

    env e3;
    assert illiquidValue(e3) == 0;
}

rule illiquidValueExcludesDefaultedOrResolved() {
    require loansLengthGhost == 1;

    uint256 instrumentID = loansGhost[0];
    uint256 loanStatus = bulletLoans.getStatus(instrumentID);
    require loanStatus == LOAN_DEFAULTED() || loanStatus == LOAN_RESOLVED();

    env e;
    assert illiquidValue(e) == 0;
}
