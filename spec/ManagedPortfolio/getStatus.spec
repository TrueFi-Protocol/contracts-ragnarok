import "ManagedPortfolio.spec"

invariant statusIsOpenBeforeEndDateWithNoDefaultedLoans(env e)
    e.block.timestamp <= endDate() && defaultedLoansCount() < 1 <=> getStatus(e) == PORTFOLIO_OPEN()
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

invariant statusIsClosedAfterEndDate(env e)
    e.block.timestamp > endDate() <=> getStatus(e) == PORTFOLIO_CLOSED()
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

invariant statusIsFrozenWithDefaultedLoans(env e)
    e.block.timestamp <= endDate() && defaultedLoansCount() > 0 <=> getStatus(e) == PORTFOLIO_FROZEN()
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
