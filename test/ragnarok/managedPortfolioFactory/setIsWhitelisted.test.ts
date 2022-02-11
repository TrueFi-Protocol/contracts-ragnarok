import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFactoryFixture } from '../fixtures/managedPortfolioFactoryFixture'

describe('ManagedPortfolioFactory.setIsWhitelisted', () => {
  const loadFixture = setupFixtureLoader()

  it('only manager can change', async () => {
    const { factory, other, wallet } = await loadFixture(managedPortfolioFactoryFixture)
    await expect(factory.connect(other).setIsWhitelisted(wallet.address, true))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('can add to whitelisted', async () => {
    const { factory, wallet, protocolOwner } = await loadFixture(managedPortfolioFactoryFixture)
    expect(await factory.isWhitelisted(wallet.address)).to.be.false
    await factory.connect(protocolOwner).setIsWhitelisted(wallet.address, true)
    expect(await factory.isWhitelisted(wallet.address)).to.be.true
  })

  it('can remove from whitelisted', async () => {
    const { factory, protocolOwner, wallet } = await loadFixture(managedPortfolioFactoryFixture)
    await factory.connect(protocolOwner).setIsWhitelisted(wallet.address, true)
    expect(await factory.isWhitelisted(wallet.address)).to.be.true
    await factory.connect(protocolOwner).setIsWhitelisted(wallet.address, false)
    expect(await factory.isWhitelisted(wallet.address)).to.be.false
  })

  it('emits event', async () => {
    const { factory, protocolOwner, wallet } = await loadFixture(managedPortfolioFactoryFixture)
    await expect(factory.connect(protocolOwner).setIsWhitelisted(wallet.address, true))
      .to.emit(factory, 'WhitelistChanged')
      .withArgs(wallet.address, true)
    await expect(factory.connect(protocolOwner).setIsWhitelisted(wallet.address, false))
      .to.emit(factory, 'WhitelistChanged')
      .withArgs(wallet.address, false)
  })
})
