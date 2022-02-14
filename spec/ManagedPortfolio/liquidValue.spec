import "ManagedPortfolio.spec"

rule liquidValueIncreasesWithDeposits() {
    uint256 depositAmount;
    uint256 liquidValue_old = liquidValue();
    bytes metadata;

    require metadata.length == 0;
    require loansLengthGhost <= 3;

    env e;
    require e.msg.sender != currentContract;
    deposit(e, depositAmount, metadata);

    uint256 liquidValue_new = liquidValue();
    assert liquidValue_old + depositAmount == liquidValue_new;
}

rule liquidValueDecreasesWithWithdraws() {
    uint256 sharesAmount;
    uint256 liquidValue_old = liquidValue();
    uint256 totalSupply_old = totalSupply();

    bytes metadata;

    env e;
    require e.msg.sender != currentContract;
    withdraw(e, sharesAmount, metadata);

    uint256 withdrawAmount = (sharesAmount * liquidValue_old) / totalSupply_old;
    uint256 liquidValue_new = liquidValue();

    assert liquidValue_new + withdrawAmount == liquidValue_old;
}

rule liquidValueDecreasesWhenIssuingLoans() {
    uint256 loanDuration;
    address borrower;
    uint256 principalAmount;
    uint256 repaymentAmount;

    require borrower != currentContract;
    require manager() != currentContract;

    uint256 liquidValue_old = liquidValue();

    env e;
    createBulletLoan(e, loanDuration, borrower, principalAmount, repaymentAmount);

    uint256 liquidValue_new = liquidValue();

    assert liquidValue_new + principalAmount <= liquidValue_old;
}

rule liquidValueIncreasesWhenLoansRepaid() {
    uint256 instrumentID;
    uint256 amount;
    uint256 liquidValue_old = liquidValue();

    require bulletLoans.ownerOf(instrumentID) == currentContract;
    require underlyingTokenGhost[instrumentID] == token;

    env e;
    require e.msg.sender != currentContract;
    bulletLoans.repay(e, instrumentID, amount);

    uint256 liquidValue_new = liquidValue();

   assert liquidValue_old + amount == liquidValue_new;
}

rule onlyWithdrawAndCreateLoanDecreaseLiquidValue(method f) {
    uint256 liquidValue_old = liquidValue();

    env e;
    callFunction(f, e);

    uint256 liquidValue_new = liquidValue();

    ifEffectThenFunction(
        liquidValue_new < liquidValue_old,
        f.selector == withdraw(uint256, bytes).selector ||
        f.selector == createBulletLoan(uint256, address, uint256, uint256).selector
    );
    assert true;
}

// Note: Someone can also transfer tokens to our contracts
//       and increase balance this way
rule onlyDepositAndRepayIncreaseLiquidValue(method f) {
    uint256 liquidValue_old = liquidValue();

    env e;
    callFunction(f, e);

    uint256 liquidValue_new = liquidValue();

    ifEffectThenFunction(
        liquidValue_new > liquidValue_old,
        f.selector == deposit(uint256, bytes).selector
    );
    assert true;
}
