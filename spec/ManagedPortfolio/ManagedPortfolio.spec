import "../Shared.spec"

using MockToken as token
using BulletLoans as bulletLoans
using ProtocolConfig as protocolConfig

methods {
    balanceOf(address) returns uint256 envfree
    defaultedLoansCount() returns uint256 envfree
    endDate() returns uint256 envfree
    latestRepaymentDate() returns uint256 envfree
    liquidValue() returns uint256 envfree
    manager() returns address envfree
    managerFee() returns uint256 envfree
    totalDeposited() returns uint256 envfree
    totalSupply() returns uint256 envfree

    bulletLoans.endDate(uint256) returns uint256 envfree
    bulletLoans.getStatus(uint256) returns uint8 envfree
    bulletLoans.ownerOf(uint256) returns address envfree

    token.allowance(address, address) returns uint256 envfree
    token.balanceOf(address) returns uint256 envfree

    protocolConfig.protocolAddress() returns address envfree
    protocolConfig.protocolFee() returns uint256 envfree

    isAllowed(address, uint256, bytes) returns bool => NONDET
    onERC721Received(address, address, uint256, bytes) returns bytes4 => DISPATCHER
    transferFrom(address, address, uint256) returns bool => DISPATCHER(true)
}

use rule proxyFunctionsCannotBeCalledByNonManagerUsers
use rule nextIdGhostNeverDecreases

// RULES

rule allERC20TransfersAreProhibited(method f) filtered { f -> isProhibited(f) } {
    env e;
    calldataarg args;

    f@withrevert(e, args);

    assert lastReverted;
}

rule loansLengthGhostNeverDecreases(method f) {
    uint256 loansLengthGhost_old = loansLengthGhost;
    // Note: Seems like Solidity doesn't include a check for list overflow
    //       (which makes sense as it would require an infeasible amount of gas)
    require loansLengthGhost_old < max_uint;

    env e;
    callFunction(f, e);

    uint256 loansLengthGhost_new = loansLengthGhost;

    assert loansLengthGhost_new >= loansLengthGhost_old;
}

// maxSize

rule depositsCannotBeGreaterThanMaxSize(method f) {
    assert true, "TODO fill me in";
}

// FUNCTIONS

function callFunction(method f, env e) {
    calldataarg args;

    if (!f.isView && !isProxyFunction(f) && !isProhibited(f)) {
        if (f.selector == deposit(uint256,bytes).selector) {
            uint256 amount;
            bytes data;

            require data.length <= 256;
            require loansLengthGhost <= 5;

            deposit(e, amount, data);
        } else if (f.selector == updateLoanParameters(uint256,uint256,uint256,bytes).selector) {
            uint256 instrumentID;
            uint256 newTotalDebt;
            uint256 newRepaymentDate;
            bytes signature;

            require signature.length <= 256;

            updateLoanParameters(e, instrumentID, newTotalDebt, newRepaymentDate, signature);
        } else if (f.isFallback) {
            f@withrevert(e, args);
        } else {
            f(e, args);
        }
    }
}

definition isProxyFunction(method f) returns bool =
    f.selector == upgradeTo(address).selector ||
    f.selector == upgradeToAndCall(address,bytes).selector ||
    f.selector == initialize(string,string,address,address,address,address,address,uint256,uint256,uint256).selector;

definition isInitialize(method f) returns bool =
    f.selector == initialize(string,string,address,address,address,address,address,uint256,uint256,uint256).selector;

definition isProhibited(method f) returns bool =
    f.selector == transfer(address,uint256).selector ||
    f.selector == transferFrom(address,address,uint256).selector;

// CONSTANTS

definition PORTFOLIO_OPEN() returns uint8 = 0;
definition PORTFOLIO_FROZEN() returns uint8 = 1;
definition PORTFOLIO_CLOSED() returns uint8 = 2;

// GHOSTS

ghost mapping (uint256 => address) underlyingTokenGhost;
ghost uint256 loansLengthGhost;
ghost mapping (uint256 => uint256) loansGhost;
ghost uint256 nextIdGhost;

hook Sstore bulletLoans.loans[KEY uint256 instrumentID].underlyingToken address value STORAGE {
    underlyingTokenGhost[instrumentID] = value;
}

hook Sload address value bulletLoans.loans[KEY uint256 instrumentID].underlyingToken STORAGE {
    require value == underlyingTokenGhost[instrumentID];
}

hook Sstore _loans.(offset 0) uint256 length STORAGE {
    loansLengthGhost = length;
}

hook Sload uint256 length _loans.(offset 0) STORAGE {
    require length == loansLengthGhost;
}

hook Sstore _loans[INDEX uint256 key] uint256 value STORAGE {
    loansGhost[key] = value;
}

hook Sload uint256 value _loans[INDEX uint256 key] STORAGE {
    require value == loansGhost[key];
}

hook Sstore bulletLoans.nextId uint256 value STORAGE {
    nextIdGhost = value;
}

hook Sload uint256 value bulletLoans.nextId STORAGE {
    require value == nextIdGhost;
}
