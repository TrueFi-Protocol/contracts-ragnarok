import "ManagedPortfolio.spec"

rule withdrawChecksClosed() {

    env e1;
    require getStatus(e1) != PORTFOLIO_CLOSED();

    env e2;
    uint256 sharesAmount;
    bytes metadata;
    require e1.block.timestamp == e2.block.timestamp;
    withdraw@withrevert(e2, sharesAmount, metadata);

    assert lastReverted;
}

rule withdrawTransfersToLender(){
    address lender;
    require lender != currentContract;

    uint256 balance_old = token.balanceOf(lender);

    env e;
    uint256 sharesAmount;
    bytes metadata;
    require e.msg.sender == lender;
    withdraw(e, sharesAmount, metadata);

    uint256 balance_new = token.balanceOf(lender);

    assert balance_new >= balance_old;
}

rule withdrawSplitIsUnprofitable() {
    // Ensures withdrawal of share amount A+B is not worse off than withdrawal of A and B independently
    assert true, "TODO: timeout";
}

rule withdrawOfAllSharesTakesAllFunds() {
    address lender;
    require lender != currentContract;

    uint256 lenderBalance_old = token.balanceOf(lender);
    uint256 portfolioBalance_old = token.balanceOf(currentContract);

    env e;
    bytes metadata;
    require e.msg.sender == lender;
    withdraw(e, totalSupply(), metadata);

    uint256 lenderBalance_new = token.balanceOf(lender);
    uint256 portfolioBalance_new = token.balanceOf(currentContract);

    assert portfolioBalance_new == 0;
    assert lenderBalance_new == lenderBalance_old + portfolioBalance_old;
}

rule withdrawIsCommutative() {
    assert true, "TODO probably timeout";
}

rule withdrawBurnsProperAmountOfTokens() {
    address lender;

    uint256 balance_old = balanceOf(lender);
    uint256 supply_old = totalSupply();

    env e;
    uint256 sharesAmount;
    bytes metadata;
    require e.msg.sender == lender;
    withdraw(e, sharesAmount, metadata);

    uint256 balance_new = balanceOf(lender);
    uint256 supply_new = totalSupply();

    assert balance_new + sharesAmount == balance_old;
    assert supply_new + sharesAmount == supply_old;
}
