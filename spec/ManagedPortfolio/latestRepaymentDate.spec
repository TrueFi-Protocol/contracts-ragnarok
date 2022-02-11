import "ManagedPortfolio.spec"

rule onlyCreateOrUpdateBulletLoanChangesLatestRepaymentDate(method f) {
    uint256 latestRepaymentDate_old = latestRepaymentDate();

    env e;
    callFunction(f, e);

    uint256 latestRepaymentDate_new = latestRepaymentDate();

    ifEffectThenFunction(
        latestRepaymentDate_old != latestRepaymentDate_new,
        f.selector == createBulletLoan(uint256,address,uint256,uint256).selector
        || f.selector == updateLoanParameters(uint256,uint256,uint256).selector
        || f.selector == updateLoanParameters(uint256,uint256,uint256, bytes).selector
    );
    assert true;
}

invariant latestRepaymentDateIsLessThanEndDate()
    latestRepaymentDate() <= endDate()
    filtered { f -> !f.isFallback && !isProxyFunction(f) && !isProhibited(f) } {
        preserved deposit(uint256 amount, bytes data) with (env _e) {
            require data.length <= 256;
            require loansLengthGhost <= 5;
        }
        preserved updateLoanParameters(uint256 instrumentID, uint256 newTotalDebt, uint256 newRepaymentDate, bytes signature) with (env _e) {
            require signature.length <= 256;
            require loansLengthGhost <= 5;
        }
    }
