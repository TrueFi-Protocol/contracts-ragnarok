import "ManagedPortfolio.spec"

use invariant totalSupplyIsZeroOrSignificantWhenNotClosed

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

rule depositChecksSignificantAmount() {
    uint256 amount;
    bytes metadata;

    require amount < token.singleToken();
    require metadata.length <= 256;

    env e;
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

rule depositDoesNotDecreasePortfolioShareTokens() {
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

    assert lenderBalance_new >= lenderBalance_old;
}

// A previous version of ManagedPortfolio was vulnerable to a decimals precision
// rounding attack.
//
// For an underlyingToken with 18 decimals, suppose Eve calls MP.deposit(1 wei)
// and then underlyingToken.transfer(MP, 1 Token).
//
// Then Alice's call of MP.deposit(1.9 Token) would only grant her 1 wei of shares,
// and she would lose 0.45 Tokens to Eve when the total balance of 2.9 Tokens gets
// split evenly by the total supply of 2 wei shares.
//
// This rule doesn't fully catch this decimals vuln, but it ensures that under reasonable
// assumptions of the portfolio value, it's not possible to do the stronger exploit
// variant:
//
// Suppose Eve calls MP.deposit(1 wei) and then underlyingToken.transfer(MP, 1 Token).
// Then if Alice calls MP.deposit(0.9 Token), then she would receive zero shares.
rule depositToMPWithoutHyperinflationIncreasesPortfolioShareTokens() {
    uint256 amount;
    bytes metadata;
    address lender;

    require metadata.length <= 256;
    require loansLengthGhost <= 1;

    // Assume that:
    //          10**token.decimals() >= MP.value() / MP.totalSupply()
    //   weis per 1 underlying token >= <weis of underlying tokens per wei of shares>.
    //
    // That is, the portfolio's shares have not inflated so much that 1 wei of shares
    // is now worth more than 1 full underlying Token.
    //
    // Without this assumption, it would be possible to deposit 1 full underlying token
    // and receive no shares.
    //
    // Getting around this assumption requires an attacker to commit at least
    // <minimum deposit in wei shares> * 10**token.decimals() == 10**(decimals() + token.decimals()) wei
    env e1;
    require value(e1) <= totalSupply() * token.singleToken();

    uint256 lenderBalance_old = balanceOf(lender);

    env e2;
    require e2.block.timestamp == e1.block.timestamp;
    require e2.msg.sender == lender;
    deposit(e2, amount, metadata);

    uint256 lenderBalance_new = balanceOf(lender);

    assert lenderBalance_new > lenderBalance_old;
}

rule depositToMPWithBoundedValueIncreasesPortfolioShareTokens() {
    uint256 amount;
    bytes metadata;
    address lender;

    require metadata.length <= 256;
    require loansLengthGhost <= 1;

    // Both assumptions are required and provide tight bounds:
    // - without the totalSupply invariant, Certora could assume an insignificant value of
    // totalSupply < 1 Token shares
    // - without limiting value() to at or below 10^18 * 10^6, an attacker could still
    // conceivably attack like thus:
    //   1. deposit the minimum of 1 USDC for 10^18 wei shares
    //   2. transfer 10^18 USDC to inflate the share value to (10^18 + 1) USDC / 10^18 wei shares
    //   3. cause deposits of 1 USDC to mint 1 USDC * 10^18 wei shares / (10^18 + 1) USDC == 0 shares
    env e1;
    requireInvariant totalSupplyIsZeroOrSignificantWhenNotClosed(e1);
    require value(e1) <= singleToken() * token.singleToken();

    uint256 lenderBalance_old = balanceOf(lender);

    env e2;
    require e2.block.timestamp == e1.block.timestamp;
    require e2.msg.sender == lender;
    deposit(e2, amount, metadata);

    uint256 lenderBalance_new = balanceOf(lender);

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
