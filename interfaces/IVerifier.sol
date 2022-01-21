// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IVerifier {
    function isValidSignature(bytes32 _hash, bytes memory _signature) external view returns (bytes4);
}
