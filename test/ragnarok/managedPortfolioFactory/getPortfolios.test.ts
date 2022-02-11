import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFactoryFixture } from '../fixtures'

describe('ManagedPortfolioFactory.getPortfolios', () => {
  const loadFixture = setupFixtureLoader()

  it('returns list of created portfolios', async () => {
    const { factory, createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const expectedPortfolios = []
    for (let i = 0; i < 3; i++) {
      const { portfolio } = await createPortfolio()
      expectedPortfolios.push(portfolio.address)
    }
    const portfolios = await factory.getPortfolios()
    expect(portfolios).to.deep.equal(expectedPortfolios)
  })
})
