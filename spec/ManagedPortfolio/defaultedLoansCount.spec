import "ManagedPortfolio.spec"

rule onlyMarkLoanAsResolvedDecreasesDefaultedLoansCount(method f) {
    uint256 defaultedLoansCount_old = defaultedLoansCount();

    env e;
    callFunction(f, e);

    ifEffectThenFunction(
        defaultedLoansCount_old - 1 == defaultedLoansCount(),
        f.selector == markLoanAsResolved(uint256).selector
    );
    assert true;
}

rule onlyMarkLoanAsDefaultedIncreasesDefaultedLoansCount(method f) {
    uint256 defaultedLoansCount_old = defaultedLoansCount();

    env e;
    callFunction(f, e);

    ifEffectThenFunction(
        defaultedLoansCount_old + 1 == defaultedLoansCount(),
        f.selector == markLoanAsDefaulted(uint256).selector
    );
    assert true;
}
