// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IBorrowerSignatureVerifier {
    function verify(
        address borrower,
        uint256 instrumentId,
        uint256 newTotalDebt,
        uint256 newRepaymentDate,
        bytes memory signature
    ) external view returns (bool);
}
