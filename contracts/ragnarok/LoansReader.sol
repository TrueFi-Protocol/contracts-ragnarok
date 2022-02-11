// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBulletLoans, BulletLoanStatus} from "./interfaces/IBulletLoans.sol";
import {IManagedPortfolio} from "./interfaces/IManagedPortfolio.sol";

struct LoanFrontendData {
    IERC20 token;
    BulletLoanStatus status;
    uint256 principal;
    uint256 totalDebt;
    uint256 amountRepaid;
    uint256 duration;
    uint256 repaymentDate;
    address recipient;
    uint256 loanId;
}

contract LoansReader {
    function getLoans(address bulletLoans, address portfolio) external view returns (LoanFrontendData[] memory) {
        uint256[] memory ids = IManagedPortfolio(portfolio).getOpenLoanIds();
        LoanFrontendData[] memory _loans = new LoanFrontendData[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            (
                IERC20 token,
                BulletLoanStatus status,
                uint256 principal,
                uint256 totalDebt,
                uint256 amountRepaid,
                uint256 duration,
                uint256 repaymentDate,
                address recipient
            ) = IBulletLoans(bulletLoans).loans(ids[i]);
            _loans[i] = LoanFrontendData(
                token,
                status,
                principal,
                totalDebt,
                amountRepaid,
                duration,
                repaymentDate,
                recipient,
                ids[i]
            );
        }
        return _loans;
    }
}
