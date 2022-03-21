import "ManagedPortfolio.spec"

definition statusIsOpenBeforeEndDateWithNoDefaultedLoansDefinition(env e) returns bool =
    e.block.timestamp <= endDate() && defaultedLoansCount() < 1 <=> getStatus(e) == PORTFOLIO_OPEN();

rule statusIsOpenBeforeEndDateWithNoDefaultedLoans {
    env e;
    assert statusIsOpenBeforeEndDateWithNoDefaultedLoansDefinition(e);
}

definition statusIsClosedAfterEndDateDefinition(env e) returns bool =
    e.block.timestamp > endDate() <=> getStatus(e) == PORTFOLIO_CLOSED();

rule statusIsClosedAfterEndDate {
    env e;
    assert statusIsClosedAfterEndDateDefinition(e);
}

definition statusIsFrozenWithDefaultedLoansDefinition(env e) returns bool =
    e.block.timestamp <= endDate() && defaultedLoansCount() > 0 <=> getStatus(e) == PORTFOLIO_FROZEN();

rule statusIsFrozenWithDefaultedLoans {
    env e;
    assert statusIsFrozenWithDefaultedLoansDefinition(e);
}
