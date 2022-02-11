import "ManagedPortfolio.spec"

rule valueIsZeroWhenNoLoansAndNoDeposits() {
    require loansLengthGhost == 0;
    require token.balanceOf(currentContract) == 0;

    env e;

    assert value(e) == 0;
}

rule valueIsLiquidValueWhenIlliquidValueIsZero() {
    uint256 amount;

    require loansLengthGhost == 0;
    require token.balanceOf(currentContract) == amount;

    env e;

    assert liquidValue() == amount;
    assert value(e) == liquidValue();
}

rule valueIsIlliquidValueWhenLiquidValueIsZero() {
    require liquidValue() == 0;
    require loansLengthGhost <= 3;

    env e;

    assert value(e) == illiquidValue(e);
}

rule valueIsSumOfLiquidAndIlliquidValues() {
    require liquidValue() > 0;
    require loansLengthGhost <= 3;

    env e;

    assert value(e) == liquidValue() + illiquidValue(e);
}
