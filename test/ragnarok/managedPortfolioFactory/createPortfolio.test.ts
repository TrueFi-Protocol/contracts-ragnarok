import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFactoryFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { ONE_PERCENT, YEAR } from 'utils/constants'

describe('ManagedPortfolioFactory.createPortfolio', () => {
  const loadFixture = setupFixtureLoader()

  it('only whitelisted', async () => {
    const { other, attemptCreatingPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    await expect(attemptCreatingPortfolio(other)).to.be.revertedWith('ManagedPortfolioFactory: Caller is not whitelisted')
  })

  it('after removing caller from whitelist', async () => {
    const { factory, manager, attemptCreatingPortfolio } = await loadFixture(managedPortfolioFactoryFixture)

    const tx = await attemptCreatingPortfolio(manager)
    expect((await tx.wait()).status).to.equal(1)

    await factory.setIsWhitelisted(manager.address, false)
    await expect(attemptCreatingPortfolio(manager)).to.be.revertedWith('ManagedPortfolioFactory: Caller is not whitelisted')
  })

  it('sets manager', async () => {
    const { manager, createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()

    expect(await portfolio.manager()).to.equal(manager.address)
  })

  it('sets underlyingToken', async () => {
    const { token, createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()

    expect(await portfolio.underlyingToken()).to.equal(token.address)
  })

  it('sets bulletLoans', async () => {
    const { factory, createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()

    expect(await portfolio.bulletLoans()).to.equal(await factory.bulletLoans())
  })

  it('sets protocolConfig', async () => {
    const { factory, createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()

    expect(await portfolio.protocolConfig()).to.equal(await factory.protocolConfig())
  })

  it('sets endDate', async () => {
    const { createPortfolio, extractCreationTimestamp } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio, tx } = await createPortfolio()

    const creationTimestamp = await extractCreationTimestamp(tx)
    expect(await portfolio.endDate()).to.equal(creationTimestamp + YEAR)
  })

  it('sets maxSize', async () => {
    const { createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()
    expect(await portfolio.maxSize()).to.equal(parseUSDC(1e7))
  })

  it('sets managerFee', async () => {
    const { createPortfolio } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()
    expect(await portfolio.managerFee()).to.equal(10 * ONE_PERCENT)
  })
})
