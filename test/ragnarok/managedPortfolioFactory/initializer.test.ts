import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFactoryFixture } from '../fixtures'

describe('ManagedPortfolioFactory.initializer', () => {
  const loadFixture = setupFixtureLoader()

  it('sets bulletLoans', async () => {
    const { factory, bulletLoans } = await loadFixture(managedPortfolioFactoryFixture)
    expect(await factory.bulletLoans()).to.equal(bulletLoans.address)
  })

  it('sets protocolConfig', async () => {
    const { factory, protocolConfig } = await loadFixture(managedPortfolioFactoryFixture)
    expect(await factory.protocolConfig()).to.equal(protocolConfig.address)
  })
})
