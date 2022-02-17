import "../Shared.spec"

using MockToken as token

methods {
    createLoan(address, uint256, uint256, uint256, address) returns uint256
    getStatus(uint256) returns uint8 envfree
    ownerOf(uint256) returns address envfree
    loans(uint256) returns (address, uint8, uint256, uint256, uint256, uint256, uint256, address) envfree
    unpaidDebt(uint256) returns uint256 envfree
    manager() returns address envfree

    token.balanceOf(address) returns uint256 envfree
    token.allowance(address, address) returns uint256 envfree

    transferFrom(address, address, uint256) => DISPATCHER

    onERC721Received(address, address, uint256, bytes) returns bytes4 => AUTO
    verify(address, uint256, uint256, uint256, bytes) returns bool => AUTO
}

use rule proxyFunctionsCannotBeCalledByNonManagerUsers
use rule nextIdGhostNeverDecreases

// RULES

invariant loanExistsIFFInstrumentIDBelowNextID(uint256 instrumentID)
    instrumentID < nextIdGhost <=> loanIsInitialised(instrumentID)
    filtered { f -> !f.isFallback && !isProxyFunction(f) } {
        preserved safeTransferFrom(address from, address to, uint256 amount, bytes data) with (env e) {
            require data.length <= 256;
        }
        preserved updateLoanParameters(uint256 instrumentID_, uint256 newTotalDebt, uint256 newRepaymentDate, bytes signature) with (env e) {
            require signature.length <= 256;
        }
    }

invariant nonExistentLoansAreSetToZero(uint256 instrumentID)
    instrumentID >= nextIdGhost => loanIsUninitialised(instrumentID)
    filtered { f -> !f.isFallback && !isProxyFunction(f) } {
        preserved safeTransferFrom(address from, address to, uint256 amount, bytes data) with (env e) {
            require data.length <= 256;
        }
        preserved updateLoanParameters(uint256 instrumentID_, uint256 newTotalDebt, uint256 newRepaymentDate, bytes signature) with (env e) {
            require signature.length <= 256;
        }
    }

// FUNCTIONS

function callFunction(method f, env e) {
    calldataarg args;

    if (!f.isView && !isProxyFunction(f)) {
        if (f.selector == safeTransferFrom(address,address,uint256,bytes).selector) {
            address from;
            address to;
            uint256 instrumentID;
            bytes data;

            require data.length <= 256;

            safeTransferFrom(e, from, to, instrumentID, data);
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

function loanHasFollowingProperties(
    uint256 instrumentID,
    address _underlyingToken,
    uint8 _status,
    uint256 _principal,
    uint256 _totalDebt,
    uint256 _amountRepaid,
    uint256 _duration,
    uint256 _repaymentDate,
    address _recipient
) returns bool {
    address __underlyingToken;
    uint8 __status;
    uint256 __principal;
    uint256 __totalDebt;
    uint256 __amountRepaid;
    uint256 __duration;
    uint256 __repaymentDate;
    address __recipient;

    __underlyingToken, __status, __principal, __totalDebt, __amountRepaid, __duration, __repaymentDate, __recipient =
        loans(instrumentID);

    return
        __underlyingToken == _underlyingToken &&
        __status == _status &&
        __principal == _principal &&
        __totalDebt == _totalDebt &&
        __amountRepaid == _amountRepaid &&
        __duration == _duration &&
        __repaymentDate == _repaymentDate &&
        __recipient == _recipient;
}

function loanIsUninitialised(uint256 instrumentID) returns bool {
    return loanHasFollowingProperties(instrumentID, 0, 0, 0, 0, 0, 0, 0, 0) && !existsGhost[instrumentID];
}

definition loanIsInitialised(uint256 instrumentID) returns bool = existsGhost[instrumentID];

definition isProxyFunction(method f) returns bool =
    f.selector == upgradeTo(address).selector ||
    f.selector == upgradeToAndCall(address,bytes).selector ||
    f.selector == initialize(address).selector;

// GHOSTS:

ghost uint256 nextIdGhost {
    init_state axiom nextIdGhost == 0;
}

ghost mapping (uint256 => bool) existsGhost {
    init_state axiom forall uint256 id. !existsGhost[id];
}

ghost mapping (uint256 => uint256) underlyingTokenGhost;

ghost mapping (uint256 => uint256) amountRepaidGhost;

ghost mapping (uint256 => uint256) totalDebtGhost;

ghost mapping (uint256 => uint256) repaymentDateGhost;

hook Sstore nextId uint256 val STORAGE {
    nextIdGhost = val;
}

hook Sload uint256 val nextId STORAGE {
    require val == nextIdGhost;
}

hook Sstore _owners[KEY uint256 instrumentID] address owner STORAGE {
    existsGhost[instrumentID] = (owner != 0);
}

hook Sload address owner _owners[KEY uint256 instrumentID] STORAGE {
    require (owner == 0) == !existsGhost[instrumentID];
}

hook Sstore loans[KEY uint256 instrumentID].underlyingToken address value STORAGE {
    uint256 _value = value;
    uint256 __value = _value & to_uint256(max_address);
    underlyingTokenGhost[instrumentID] = __value;
}

hook Sload address value loans[KEY uint256 instrumentID].underlyingToken STORAGE {
    uint256 _value = value;
    require (_value & to_uint256(max_address)) == underlyingTokenGhost[instrumentID];
}

hook Sstore loans[KEY uint256 instrumentID].amountRepaid uint256 value STORAGE {
    amountRepaidGhost[instrumentID] = value;
}

hook Sload uint256 value loans[KEY uint256 instrumentID].amountRepaid STORAGE {
    require value == amountRepaidGhost[instrumentID];
}

hook Sstore loans[KEY uint256 instrumentID].totalDebt uint256 value STORAGE {
    totalDebtGhost[instrumentID] = value;
}

hook Sload uint256 value loans[KEY uint256 instrumentID].totalDebt STORAGE {
    require value == totalDebtGhost[instrumentID];
}

hook Sstore loans[KEY uint256 instrumentID].repaymentDate uint256 value STORAGE {
    repaymentDateGhost[instrumentID] = value;
}

hook Sload uint256 value loans[KEY uint256 instrumentID].repaymentDate STORAGE {
    require value == repaymentDateGhost[instrumentID];
}
