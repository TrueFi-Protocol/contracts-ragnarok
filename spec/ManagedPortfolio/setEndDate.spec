import "ManagedPortfolio.spec"

rule setEndDateSetsEndDate() {
    uint256 _endDate;

    env e;
    setEndDate(e, _endDate);

    assert endDate() == _endDate;
}

rule onlySetEndDateSetsEndDate(method f) {
    uint256 endDate_old = endDate();

    env e;
    calldataarg args;
    callFunction(f, e);

    ifEffectThenFunction(
      endDate() != endDate_old,
      f.selector == setEndDate(uint256).selector
    );

    assert true;
}

rule setEndDateRevertsIfDateIncreased() {
    uint256 _endDate;

    env e;
    require _endDate > endDate();
    setEndDate@withrevert(e, _endDate);

    assert lastReverted;
}

rule setEndDateRevertsIfDateLessThanLatestRepaymentDate() {
    uint256 _endDate;

    env e;
    require _endDate < latestRepaymentDate();
    setEndDate@withrevert(e, _endDate);

    assert lastReverted;
}
