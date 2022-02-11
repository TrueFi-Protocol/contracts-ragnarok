import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { YEAR, ONE_PERCENT } from 'utils/constants'

describe('ManagedPortfolio.initializer', () => {
  const loadFixture = setupFixtureLoader()

  it('sets name', async () => {
    const { portfolio, MANAGED_PORTFOLIO_NAME } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.name()).to.equal(MANAGED_PORTFOLIO_NAME)
  })

  it('sets symbol', async () => {
    const { portfolio, MANAGED_PORTFOLIO_SYMBOL } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.symbol()).to.equal(MANAGED_PORTFOLIO_SYMBOL)
  })

  it('sets manager', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.manager()).to.equal(manager.address)
  })

  it('sets underlyingToken', async () => {
    const { portfolio, token } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.underlyingToken()).to.equal(token.address)
  })

  it('sets bulletLoans', async () => {
    const { portfolio, bulletLoans } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.bulletLoans()).to.equal(bulletLoans.address)
  })

  it('sets protocolConfig', async () => {
    const { portfolio, protocolConfig } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.protocolConfig()).to.equal(protocolConfig.address)
  })

  it('sets endDate', async () => {
    const { portfolio, getTxTimestamp } = await loadFixture(managedPortfolioFixture)
    const creationTimestamp = await getTxTimestamp(portfolio.deployTransaction)
    expect(await portfolio.endDate()).to.equal(creationTimestamp + YEAR)
  })

  it('sets manager fee', async () => {
    const { portfolio } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.managerFee()).to.equal(ONE_PERCENT)
  })
})
