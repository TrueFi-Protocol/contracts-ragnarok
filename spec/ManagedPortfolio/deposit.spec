import "ManagedPortfolio.spec"

rule depositsAreProhibitedAfterEndDate() {
    uint256 amount;
    bytes metadata;

    require metadata.length <= 256;
    require loansLengthGhost <= 5;

    env e;
    require e.block.timestamp > endDate();
    deposit@withrevert(e, amount, metadata);

    assert lastReverted;
}

rule depositTransfersToPortfolio() {
    uint256 amount;
    bytes metadata;

    require metadata.length <= 256;
    require loansLengthGhost <= 5;

    uint256 portfolioBalance_old = token.balanceOf(currentContract);

    env e;
    require e.msg.sender != currentContract;
    deposit(e, amount, metadata);

    uint256 portfolioBalance_new = token.balanceOf(currentContract);

    assert portfolioBalance_new == portfolioBalance_old + amount;
}

rule depositIssuesPortfolioShareTokens() {
    uint256 amount;
    bytes metadata;
    address lender;

    require metadata.length <= 256;
    require loansLengthGhost <= 5;

    uint256 lenderBalance_old = balanceOf(lender);

    env e;
    require e.msg.sender == lender;
    deposit(e, amount, metadata);

    uint256 lenderBalance_new = balanceOf(lender);

    require lenderBalance_new != lenderBalance_old;
    assert lenderBalance_new > lenderBalance_old;
}

rule onlyDepositIncreasesPortfolioShareTokensBalance(method f) {
    address lender;
    uint256 lenderBalance_old = balanceOf(lender);

    env e;
    callFunction(f, e);

    uint256 lenderBalance_new = balanceOf(lender);

    ifEffectThenFunction(
        lenderBalance_new > lenderBalance_old,
        f.selector == deposit(uint256,bytes).selector
    );
    assert true;
}

rule depositIncreasesTotalDeposited() {
    uint256 amount;
    bytes metadata;
    address lender;

    require metadata.length <= 256;
    require loansLengthGhost <= 5;

    uint256 totalDeposited_old = totalDeposited();

    env e;
    require e.msg.sender == lender;
    deposit(e, amount, metadata);

    uint256 totalDeposited_new = totalDeposited();

    assert totalDeposited_new == totalDeposited_old + amount;
}

rule onlyDepositChangesTotalDeposited(method f) {
    address lender;
    uint256 totalDeposited_old = totalDeposited();

    env e;
    callFunction(f, e);

    uint256 totalDeposited_new = totalDeposited();

    ifEffectThenFunction(
        totalDeposited_new != totalDeposited_old,
        f.selector == deposit(uint256,bytes).selector
    );
    assert true;
}

rule depositRevertsIfLoanIsDefaulted() {
    uint256 amount;
    bytes metadata;
    address lender;

    require metadata.length <= 256;
    require loansLengthGhost <= 5;

    require defaultedLoansCount() > 0;

    env e;
    deposit@withrevert(e, amount, metadata);

    assert lastReverted;
}
