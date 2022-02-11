import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFactoryFixture } from '../fixtures'
import { Wallet } from 'ethers'

describe('ManagedPortfolioFactory.setPortfolioImplementation', () => {
  const loadFixture = setupFixtureLoader()
  const newImplementation = Wallet.createRandom().address

  it('only manager can change', async () => {
    const { factory, other } = await loadFixture(managedPortfolioFactoryFixture)
    await expect(factory.connect(other).setPortfolioImplementation(newImplementation))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('changes implementation', async () => {
    const { factory, protocolOwner } = await loadFixture(managedPortfolioFactoryFixture)
    await factory.connect(protocolOwner).setPortfolioImplementation(newImplementation)
    expect(await factory.portfolioImplementation()).to.equal(newImplementation)
  })

  it('emits event', async () => {
    const { factory, protocolOwner } = await loadFixture(managedPortfolioFactoryFixture)
    await expect(factory.connect(protocolOwner).setPortfolioImplementation(newImplementation))
      .to.emit(factory, 'PortfolioImplementationChanged')
      .withArgs(newImplementation)
  })
})
