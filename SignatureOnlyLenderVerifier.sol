// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import {SignatureValidator} from "./libs/SignatureValidator.sol";
import {ILenderVerifier} from "./interfaces/ILenderVerifier.sol";

contract SignatureOnlyLenderVerifier is EIP712, ILenderVerifier {
    string internal constant DOMAIN_NAME = "TrueFi";
    string internal constant DOMAIN_VERSION = "1.0";
    bytes32 internal constant AGREEMENT_TYPEHASH = keccak256("Agreement(string confirmation)");

    string public depositMessage;
    bytes32 public immutable digest;

    constructor(string memory _depositMessage) EIP712(DOMAIN_NAME, DOMAIN_VERSION) {
        depositMessage = _depositMessage;
        digest = _hashTypedDataV4(keccak256(abi.encode(AGREEMENT_TYPEHASH, keccak256(bytes(_depositMessage)))));
    }

    function isAllowed(
        address lender,
        uint256,
        bytes memory signature
    ) external view returns (bool) {
        return SignatureValidator.isValidSignature(lender, digest, signature);
    }
}
