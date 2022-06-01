import "BulletLoans.spec"

use invariant loanExistsIFFInstrumentIDBelowNextID

rule updateLoanParametersRevertsIfCallerIsNotOwnerOfLoan() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;

    env e;
    require e.msg.sender != ownerOf(instrumentID);
    updateLoanParameters@withrevert(e, instrumentID, newTotalDebt, newRepaymentDate);

    assert lastReverted;
}

rule updateLoanParametersCantIncreaseTotalDebt() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;

    uint256 totalDebt_old = totalDebtGhost[instrumentID];

    env e;
    updateLoanParameters(e, instrumentID, newTotalDebt, newRepaymentDate);

    uint256 totalDebt_new = totalDebtGhost[instrumentID];

    assert totalDebt_new <= totalDebt_old;
}

rule updateLoanParametersCantDecreaseRepaymentDate() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;

    uint256 repaymentDate_old = repaymentDateGhost[instrumentID];

    env e;
    updateLoanParameters(e, instrumentID, newTotalDebt, newRepaymentDate);

    uint256 repaymentDate_new = repaymentDateGhost[instrumentID];

    assert repaymentDate_new >= repaymentDate_old;
}

rule updateLoanParametersChangesLoanParameters() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;

    env e;
    updateLoanParameters(e, instrumentID, newTotalDebt, newRepaymentDate);

    assert totalDebtGhost[instrumentID] == newTotalDebt;
    assert repaymentDateGhost[instrumentID] == newRepaymentDate;
}

rule updateLoanParametersWithSignatureRevertsIfCallerIsNotOwnerOfLoan() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;
    bytes signature;
    require signature.length < 256;

    env e;
    require e.msg.sender != ownerOf(instrumentID);
    updateLoanParameters@withrevert(e, instrumentID, newTotalDebt, newRepaymentDate, signature);

    assert lastReverted;
}

rule updateLoanParametersWithSignatureChangesLoanParameters() {
    uint256 instrumentID;
    uint256 newTotalDebt;
    uint256 newRepaymentDate;
    bytes signature;
    require signature.length < 256;

    env e;
    updateLoanParameters(e, instrumentID, newTotalDebt, newRepaymentDate, signature);

    assert totalDebtGhost[instrumentID] == newTotalDebt;
    assert repaymentDateGhost[instrumentID] == newRepaymentDate;
}

rule onlyUpdateLoanParametersCanDecreaseTotalDebt(method f) {
    uint256 instrumentID;
    require loanIsInitialised(instrumentID);
    requireInvariant loanExistsIFFInstrumentIDBelowNextID(instrumentID);

    uint256 totalDebt_old = totalDebtGhost[instrumentID];

    env e;
    callFunction(f, e);

    uint256 totalDebt_new = totalDebtGhost[instrumentID];

    ifEffectThenFunction(
        totalDebt_new < totalDebt_old,
        f.selector == updateLoanParameters(uint256,uint256,uint256).selector ||
        f.selector == updateLoanParameters(uint256,uint256,uint256,bytes).selector
    );
    assert true;
}

rule onlyUpdateLoanParametersCanIncreaseTotalDebt(method f) {
    uint256 instrumentID;
    require loanIsInitialised(instrumentID);
    requireInvariant loanExistsIFFInstrumentIDBelowNextID(instrumentID);

    uint256 totalDebt_old = totalDebtGhost[instrumentID];

    env e;
    callFunction(f, e);

    uint256 totalDebt_new = totalDebtGhost[instrumentID];

    ifEffectThenFunction(
        totalDebt_new > totalDebt_old,
        f.selector == updateLoanParameters(uint256,uint256,uint256,bytes).selector
    );
    assert true;
}

rule onlyMarkLoanAsDefaultedChangesStatusFromIssuedToDefaulted(method f) {
    uint256 instrumentID;

    require getStatus(instrumentID) == LOAN_ISSUED();

    env e;
    callFunction(f, e);

    bool statement = getStatus(instrumentID) == LOAN_DEFAULTED();
    ifEffectThenFunction(
        statement,
        f.selector == markLoanAsDefaulted(uint256).selector
    );
    assert true;
}
