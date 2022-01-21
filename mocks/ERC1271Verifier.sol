// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IVerifier} from "../interfaces/IVerifier.sol";

contract ERC1271Verifier is IVerifier {
    bytes4 internal constant MAGIC_VALUE = bytes4(keccak256("isValidSignature(bytes32,bytes)")); // 0x1626ba7e

    address signer;

    constructor() {
        signer = msg.sender;
    }

    function isValidSignature(bytes32 _dataHash, bytes calldata _signature) external view returns (bytes4) {
        address recovered = ECDSA.recover(_dataHash, _signature);
        return recovered == signer ? MAGIC_VALUE : bytes4(0);
    }
}
