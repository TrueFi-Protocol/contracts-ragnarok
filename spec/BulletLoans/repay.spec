import "BulletLoans.spec"

use invariant nonExistentLoansAreSetToZero

rule repayRevertsIfNonExistent() {
    uint256 instrumentID;
    uint256 amount;
    require loanIsUninitialised(instrumentID);

    env e;
    repay@withrevert(e, instrumentID, amount);

    assert lastReverted;
}

rule allowAnyAddressToRepayIfPossibleToRepay() {
    uint256 instrumentID;
    require underlyingTokenGhost[instrumentID] == token;
    uint256 amount;

    storage initialState = lastStorage;
    env e1;
    repay(e1, instrumentID, amount);

    env e2;
    uint256 balanceOfSender = token.balanceOf(e2.msg.sender) at initialState;
    require e2.msg.sender != 0 && e2.msg.value == 0;
    require balanceOfSender >= amount;
    require token.allowance(e2.msg.sender, currentContract) >= amount;
    require balanceOfSender
        + token.balanceOf(currentContract)
        + token.balanceOf(ownerOf(instrumentID))
        <= max_uint;
    repay@withrevert(e2, instrumentID, amount);

    assert !lastReverted;
}

rule repayDecreasesUnpaidDebt() {
    uint256 instrumentID;
    uint256 unpaidDebt_old = unpaidDebt(instrumentID);

    uint256 amount;
    env e;
    repay(e, instrumentID, amount);

    uint256 unpaidDebt_new_expected;
    if (amount <= unpaidDebt_old) {
        unpaidDebt_new_expected = unpaidDebt_old - amount;
    } else {
        unpaidDebt_new_expected = 0;
    }

    uint256 unpaidDebt_new = unpaidDebt(instrumentID);

    assert unpaidDebt_new == unpaidDebt_new_expected;
}

rule onlyRepayDecreasesUnpaidDebt(method f)
filtered { f ->
    f.selector != updateLoanParameters(uint256,uint256,uint256).selector &&
    f.selector != updateLoanParameters(uint256,uint256,uint256,bytes).selector &&
    !f.isFallback
} {
    uint256 instrumentID;
    requireInvariant nonExistentLoansAreSetToZero(instrumentID);

    uint256 unpaidDebt_old = unpaidDebt(instrumentID);

    env e;
    callFunction(f, e);

    uint256 unpaidDebt_new = unpaidDebt(instrumentID);

    ifEffectThenFunction(
        unpaidDebt_new < unpaidDebt_old,
        f.selector == repay(uint256,uint256).selector
    );
    assert true;
}

rule repayTransfersTokensToPortfolio() {
    uint256 instrumentID;
    require underlyingTokenGhost[instrumentID] == token;
    uint256 amount;

    address borrower;
    address loanOwner = ownerOf(instrumentID);
    require borrower != loanOwner;

    uint256 userTokenBalance_old = token.balanceOf(borrower);
    uint256 portfolioTokenBalance_old = token.balanceOf(loanOwner);

    env e;
    require e.msg.sender == borrower;
    repay(e, instrumentID, amount);

    uint256 userTokenBalance_new = token.balanceOf(borrower);
    uint256 portfolioTokenBalance_new = token.balanceOf(loanOwner);

    assert userTokenBalance_new == userTokenBalance_old - amount;
    assert portfolioTokenBalance_new == portfolioTokenBalance_old + amount;
}

rule repayIncreasesAmountRepaid() {
    uint256 instrumentID;
    uint256 amount;

    uint256 amountRepaid_old = amountRepaidGhost[instrumentID];

    env e;
    repay(e, instrumentID, amount);

    uint256 amountRepaid_new = amountRepaidGhost[instrumentID];

    assert amountRepaid_new == amountRepaid_old + amount;
}

rule onlyRepayIncreasesAmountRepaid(method f) {
    uint256 instrumentID;
    requireInvariant nonExistentLoansAreSetToZero(instrumentID);

    uint256 amountRepaid_old = amountRepaidGhost[instrumentID];

    env e;
    callFunction(f, e);

    uint256 amountRepaid_new = amountRepaidGhost[instrumentID];

    ifEffectThenFunction(
        amountRepaid_new != amountRepaid_old,
        f.selector == repay(uint256,uint256).selector
    );
    assert true;
}
