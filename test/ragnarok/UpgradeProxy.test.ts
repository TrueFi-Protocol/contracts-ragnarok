import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { proxyUpgradeFixture } from './fixtures'
import {
  DummyV2__factory,
  DummyV3__factory,
} from 'contracts'

describe('upgrade proxy', () => {
  const loadFixture = setupFixtureLoader()

  it('reads variable value correctly', async () => {
    const { proxy } = await loadFixture(proxyUpgradeFixture)

    expect(await proxy.a()).to.equal(42)
  })

  it('does not corrupt storage after upgrade to DummyV2', async () => {
    const { proxy, v2Implementation, manager } = await loadFixture(proxyUpgradeFixture)

    await proxy.upgradeTo(v2Implementation.address)
    const upgradedProxy = new DummyV2__factory(manager).attach(proxy.address)

    expect(await upgradedProxy.a()).to.equal(42)
    await upgradedProxy.setB(manager.address)
    expect(await upgradedProxy.a()).to.equal(42)
    expect(await upgradedProxy.b()).to.equal(manager.address)
  })

  it('corrupts storage after variables reorder', async () => {
    const { proxy, v2Implementation, v3Implementation, manager } = await loadFixture(proxyUpgradeFixture)

    await proxy.upgradeTo(v2Implementation.address)
    let upgradedProxy = new DummyV2__factory(manager).attach(proxy.address)
    await upgradedProxy.setB(manager.address)

    await proxy.upgradeTo(v3Implementation.address)
    upgradedProxy = new DummyV3__factory(manager).attach(proxy.address)

    await upgradedProxy.setB(manager.address)
    expect(await upgradedProxy.a()).not.to.equal(42)
    expect(await upgradedProxy.b()).to.equal(manager.address)
  })

  it('prevents from upgrading to non-upgradeable implementation', async () => {
    const { proxy, v2Implementation, v4Implementation, manager } = await loadFixture(proxyUpgradeFixture)

    await proxy.upgradeTo(v2Implementation.address)
    const upgradedProxy = new DummyV2__factory(manager).attach(proxy.address)
    await upgradedProxy.setB(manager.address)

    await expect(proxy.upgradeTo(v4Implementation.address))
      .to.be.revertedWith('Address: low-level delegate call failed')
  })

  it('does not allow non-manager to upgrade', async () => {
    const { proxy, v2Implementation, nonManager } = await loadFixture(proxyUpgradeFixture)

    await expect(proxy.connect(nonManager).upgradeTo(v2Implementation.address)).to.be.revertedWith('Manageable: Caller is not the manager')
  })
})
