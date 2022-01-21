// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IVerifier} from "../interfaces/IVerifier.sol";

library SignatureValidator {
    bytes4 constant MAGIC_VALUE = bytes4(keccak256("isValidSignature(bytes32,bytes)")); // 0x1626ba7e

    function isValidSignature(
        address signer,
        bytes32 message,
        bytes memory signature
    ) internal view returns (bool) {
        if (Address.isContract(signer)) {
            return IVerifier(signer).isValidSignature(message, signature) == MAGIC_VALUE;
        } else {
            address recovered = ECDSA.recover(message, signature);
            return recovered == signer;
        }
    }
}
