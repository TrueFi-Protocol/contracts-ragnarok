import "ManagedPortfolio.spec"

rule setManagerFeeSetsManagerFee() {
    uint256 _managerFee;

    env e;
    setManagerFee(e, _managerFee);

    assert managerFee() == _managerFee;
}

rule onlySetManagerFeeSetsManagerFee(method f) {
    uint256 managerFee_old = managerFee();

    env e;
    callFunction(f, e);

    ifEffectThenFunction(
      managerFee() != managerFee_old,
      f.selector == setManagerFee(uint256).selector
    );

    assert true;
}
