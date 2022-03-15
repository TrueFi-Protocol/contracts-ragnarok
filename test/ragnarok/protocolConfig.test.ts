import { ProtocolConfig__factory } from 'contracts'
import { Wallet } from 'ethers'
import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { deployBehindProxy } from 'utils'
import { ONE_PERCENT } from 'utils/constants'

export async function fixture([manager, protocol, newProtocol]: Wallet[]) {
  const config = await deployBehindProxy(new ProtocolConfig__factory(manager), 10 * ONE_PERCENT, protocol.address)
  return { config, manager, protocol, newProtocol }
}

describe('ProtocolConfig', () => {
  const loadFixture = setupFixtureLoader()

  describe('initializer', () => {
    it('sets fee', async () => {
      const { config } = await loadFixture(fixture)
      expect(await config.protocolFee()).to.equal(10 * ONE_PERCENT)
    })

    it('sets protocol', async () => {
      const { config, protocol } = await loadFixture(fixture)
      expect(await config.protocolAddress()).to.equal(protocol.address)
    })

    it('sets manager', async () => {
      const { config, manager } = await loadFixture(fixture)
      expect(await config.manager()).to.equal(manager.address)
    })

    it('cannot be initialized post deploy', async () => {
      const { manager, protocol } = await loadFixture(fixture)
      const implementation = await new ProtocolConfig__factory(manager).deploy()
      await expect(implementation.initialize(0, protocol.address)).to.be.revertedWith('Initializable: contract is already initialized')
    })
  })

  describe('setFee', () => {
    it('changes fee', async () => {
      const { config } = await loadFixture(fixture)
      await config.setProtocolFee(20 * ONE_PERCENT)
      expect(await config.protocolFee()).to.equal(20 * ONE_PERCENT)
    })

    it('only manager can change fee', async () => {
      const { config, protocol } = await loadFixture(fixture)
      await expect(config.connect(protocol).setProtocolFee(20 * ONE_PERCENT)).to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('emits event', async () => {
      const { config } = await loadFixture(fixture)
      await expect(config.setProtocolFee(20 * ONE_PERCENT))
        .to.emit(config, 'ProtocolFeeChanged')
        .withArgs(20 * ONE_PERCENT)
    })
  })

  describe('setProtocolAddress', () => {
    it('changes protocol address', async () => {
      const { config, newProtocol } = await loadFixture(fixture)
      await config.setProtocolAddress(newProtocol.address)
      expect(await config.protocolAddress()).to.equal(newProtocol.address)
    })

    it('only manager can change protocol address', async () => {
      const { config, protocol, newProtocol } = await loadFixture(fixture)
      await expect(config.connect(protocol).setProtocolAddress(newProtocol.address))
        .to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('emits event', async () => {
      const { config, newProtocol } = await loadFixture(fixture)
      await expect(config.setProtocolAddress(newProtocol.address))
        .to.emit(config, 'ProtocolAddressChanged')
        .withArgs(newProtocol.address)
    })
  })
})
