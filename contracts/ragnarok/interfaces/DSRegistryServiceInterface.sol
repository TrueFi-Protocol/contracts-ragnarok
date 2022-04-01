// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

// stripped-down version of interface with only the functions we need
// see full interface at https://github.com/securitize-io/DSTokenInterfaces/blob/master/contracts/dsprotocol/registry/DSRegistryServiceInterface.sol
interface DSRegistryServiceInterface {
    // takes a wallet address and returns an investor id
    function getInvestor(address _address) external view returns (string memory);

    // takes an investor id and returns whether they're an investor
    function isInvestor(string memory _id) external view returns (bool);
}
