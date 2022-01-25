// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {InitializableManageable} from "./access/InitializableManageable.sol";
import {IBulletLoans, BulletLoanStatus} from "./interfaces/IBulletLoans.sol";
import {IBorrowerSignatureVerifier} from "./interfaces/IBorrowerSignatureVerifier.sol";

contract BulletLoans is ERC721, InitializableManageable, IBulletLoans {
    using SafeERC20 for IERC20;

    uint256 internal nextId;
    mapping(uint256 => LoanMetadata) public loans;
    IBorrowerSignatureVerifier public borrowerSignatureVerifier;

    event LoanCreated(uint256 instrumentId);

    event LoanRepaid(uint256 instrumentId, uint256 amount);

    event LoanStatusChanged(uint256 instrumentId, BulletLoanStatus newStatus);

    event LoanParametersChanged(uint256 instrumentId, uint256 newTotalDebt, uint256 newRepaymentDate);

    constructor() ERC721("BulletLoans", "BulletLoans") InitializableManageable(msg.sender) {}

    function initialize(IBorrowerSignatureVerifier _borrowerSignatureVerifier) external initializer {
        InitializableManageable.initialize(msg.sender);
        borrowerSignatureVerifier = _borrowerSignatureVerifier;
    }

    function createLoan(
        IERC20 _underlyingToken,
        uint256 _principal,
        uint256 _totalDebt,
        uint256 _duration,
        address _recipient
    ) external returns (uint256) {
        require(_totalDebt >= _principal, "BulletLoans: Total debt cannot be less than principal");
        require(_duration > 0, "BulletLoans: Loan duration must be nonzero");

        uint256 instrumentId = nextId++;
        loans[instrumentId] = LoanMetadata(
            _underlyingToken,
            BulletLoanStatus.Issued,
            _principal,
            _totalDebt,
            0,
            _duration,
            _duration + block.timestamp,
            _recipient
        );
        _safeMint(msg.sender, instrumentId);

        emit LoanCreated(instrumentId);

        return instrumentId;
    }

    function repay(uint256 instrumentId, uint256 amount) external {
        require(_exists(instrumentId), "BulletLoans: Cannot repay non-existent loan");
        require(getStatus(instrumentId) == BulletLoanStatus.Issued, "BulletLoans: Can only repay issued loan");
        LoanMetadata storage loan = loans[instrumentId];
        loan.amountRepaid += amount;
        require(loan.totalDebt >= loan.amountRepaid, "BulletLoans: Loan cannot be overpaid");

        if (loan.amountRepaid >= loan.totalDebt) {
            _changeLoanStatus(instrumentId, BulletLoanStatus.FullyRepaid);
        }
        loan.underlyingToken.safeTransferFrom(msg.sender, ownerOf(instrumentId), amount);
        emit LoanRepaid(instrumentId, amount);
    }

    function markLoanAsDefaulted(uint256 instrumentId) external {
        require(ownerOf(instrumentId) == msg.sender, "BulletLoans: Caller is not the owner of the loan");
        require(loans[instrumentId].status == BulletLoanStatus.Issued, "BulletLoans: Loan is not in issued state");
        _changeLoanStatus(instrumentId, BulletLoanStatus.Defaulted);
    }

    function markLoanAsResolved(uint256 instrumentId) external {
        require(ownerOf(instrumentId) == msg.sender, "BulletLoans: Caller is not the owner of the loan");
        require(loans[instrumentId].status == BulletLoanStatus.Defaulted, "BulletLoans: Cannot resolve not defaulted loan");
        _changeLoanStatus(instrumentId, BulletLoanStatus.Resolved);
    }

    function name() public pure override returns (string memory) {
        return "BulletLoans";
    }

    function symbol() public pure override returns (string memory) {
        return "BulletLoans";
    }

    function principal(uint256 instrumentId) external view returns (uint256) {
        return loans[instrumentId].principal;
    }

    function underlyingToken(uint256 instrumentId) external view returns (IERC20) {
        return loans[instrumentId].underlyingToken;
    }

    function recipient(uint256 instrumentId) external view returns (address) {
        return loans[instrumentId].recipient;
    }

    function endDate(uint256 instrumentId) external view returns (uint256) {
        return loans[instrumentId].repaymentDate;
    }

    function unpaidDebt(uint256 instrumentId) external view returns (uint256) {
        LoanMetadata memory loan = loans[instrumentId];
        return saturatingSub(loan.totalDebt, loan.amountRepaid);
    }

    function getStatus(uint256 instrumentId) public view returns (BulletLoanStatus) {
        require(_exists(instrumentId), "BulletLoans: Cannot get status of non-existent loan");
        return loans[instrumentId].status;
    }

    function _changeLoanStatus(uint256 instrumentId, BulletLoanStatus status) private {
        loans[instrumentId].status = status;
        emit LoanStatusChanged(instrumentId, status);
    }

    function saturatingSub(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a - b : 0;
    }

    function updateLoanParameters(
        uint256 instrumentId,
        uint256 newTotalDebt,
        uint256 newRepaymentDate
    ) external {
        require(ownerOf(instrumentId) == msg.sender, "BulletLoans: Caller is not the owner of the loan");
        LoanMetadata storage loan = loans[instrumentId];
        require(newTotalDebt <= loan.totalDebt, "BulletLoans: Loan total debt cannot be increased without borrower consent");
        require(newRepaymentDate >= loan.repaymentDate, "BulletLoans: Loan end date cannot be decreased without borrower consent");

        loan.totalDebt = newTotalDebt;
        loan.duration += newRepaymentDate - loan.repaymentDate;
        loan.repaymentDate = newRepaymentDate;

        if (loan.amountRepaid >= loan.totalDebt && loan.status == BulletLoanStatus.Issued) {
            _changeLoanStatus(instrumentId, BulletLoanStatus.FullyRepaid);
        }

        emit LoanParametersChanged(instrumentId, newTotalDebt, newRepaymentDate);
    }

    function updateLoanParameters(
        uint256 instrumentId,
        uint256 newTotalDebt,
        uint256 newRepaymentDate,
        bytes memory borrowerSignature
    ) external {
        require(ownerOf(instrumentId) == msg.sender, "BulletLoans: Caller is not the owner of the loan");
        LoanMetadata storage loan = loans[instrumentId];
        require(
            borrowerSignatureVerifier.verify(loan.recipient, instrumentId, newTotalDebt, newRepaymentDate, borrowerSignature),
            "BulletLoans: Signature is invalid"
        );
        require(newRepaymentDate >= loan.repaymentDate - loan.duration, "BulletLoans: repayment date cannot be less than start date");

        loan.totalDebt = newTotalDebt;
        if (newRepaymentDate > loan.repaymentDate) {
            loan.duration += newRepaymentDate - loan.repaymentDate;
        } else {
            loan.duration -= loan.repaymentDate - newRepaymentDate;
        }
        loan.repaymentDate = newRepaymentDate;

        if (loan.amountRepaid >= loan.totalDebt && loan.status == BulletLoanStatus.Issued) {
            _changeLoanStatus(instrumentId, BulletLoanStatus.FullyRepaid);
        }

        emit LoanParametersChanged(instrumentId, newTotalDebt, newRepaymentDate);
    }
}
