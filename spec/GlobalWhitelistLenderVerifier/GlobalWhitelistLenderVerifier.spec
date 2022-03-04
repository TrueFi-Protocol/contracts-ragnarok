methods {
    manager() returns address envfree
}

rule onlyManagerCanChangeStatus(method f) {
    address user;
    bool status_old = _isAllowed(user);

    calldataarg args;
    env e;
    require e.msg.sender != manager();
    f@withrevert(e, args);

    bool reverted = lastReverted;
    bool status_new = _isAllowed(user);

    assert (status_new != status_old) => reverted;
}

rule setWhitelistStatusChangesStatus() {
    address user;
    bool status;

    env e;
    setWhitelistStatus(e, user, status);

    assert _isAllowed(user) == status;
}

rule setWhitelistStatusForManyChangesStatus() {
    address[] addressesToWhitelist;
    bool status;
    require addressesToWhitelist.length < 5;

    env e;
    setWhitelistStatusForMany(e, addressesToWhitelist, status);

    uint256 i;
    require i < addressesToWhitelist.length;
    assert _isAllowed(addressesToWhitelist[i]) == status;
}

rule setWhitelistStatusChecksCallerIsManager() {
    calldataarg args;

    env e;
    require e.msg.sender != manager();
    setWhitelistStatus@withrevert(e, args);

    assert lastReverted;
}

rule setWhitelistStatusForManyChecksCallerIsManager() {
    calldataarg args;

    env e;
    require e.msg.sender != manager();
    setWhitelistStatusForMany@withrevert(e, args);

    assert lastReverted;
}

rule onlySetWhitelistStatusChangesIsAllowed(method f) {
    address user;
    bool status_old = _isAllowed(user);

    env e;
    callFunction(f, e);

    bool status_new = _isAllowed(user);

    ifEffectThenFunction(
        status_old != status_new,
        f.selector == setWhitelistStatus(address, bool).selector ||
        f.selector == setWhitelistStatusForMany(address[], bool).selector
    );

    assert true;
}

function _isAllowed(address user) returns bool {
    uint256 arg;
    bytes memory;

    env e;
    return isAllowed(e, user, arg, memory);
}

function ifEffectThenFunction(bool isEffect, bool isFunction) {
    if (!isFunction) {
        assert !isEffect;
    } else {
        require isEffect; // This relies on vacuity check to verify that this reachable;
    }
}

function callFunction(method f, env e) {
    calldataarg args;

    if (!f.isView) {
        if (f.selector == setWhitelistStatusForMany(address[], bool).selector) {
            address[] addressesToWhitelist;
            bool status;
            require addressesToWhitelist.length < 5;

            setWhitelistStatusForMany(e, addressesToWhitelist, status);
        } else if (f.isFallback) {
            f@withrevert(e, args);
        } else {
            f(e, args);
        }
    }
}
