// Shared rules

rule proxyFunctionsCannotBeCalledByNonManagerUsers(method f) filtered { f -> isProxyFunction(f) } {
    env e;
    calldataarg args;

    require e.msg.sender != manager();

    f@withrevert(e, args);

    assert lastReverted;
}

rule nextIdGhostNeverDecreases(method f) {
    uint256 nextId_old = nextIdGhost;

    env e;
    callFunction(f, e);

    uint256 nextId_new = nextIdGhost;

    assert nextId_new >= nextId_old;
}

// Shared functions

function ifEffectThenFunction(bool isEffect, bool isFunction) {
    if (!isFunction) {
        assert !isEffect;
    } else {
        require isEffect; // This relies on vacuity check to verify that this reachable;
    }
}

// Constants

definition LOAN_ISSUED() returns uint8 = 0;
definition LOAN_FULLY_REPAID() returns uint8 = 1;
definition LOAN_DEFAULTED() returns uint8 = 2;
definition LOAN_RESOLVED() returns uint8 = 3;

definition DAY() returns uint256 = 60 * 60 * 24;
definition YEAR() returns uint256 = 365 * DAY();
