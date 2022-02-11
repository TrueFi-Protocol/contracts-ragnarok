import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'

describe('ManagedPortfolio.setManagerFee', () => {
  const loadFixture = setupFixtureLoader()

  it('sets the manager fee', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)

    await portfolio.connect(manager).setManagerFee(2000)
    expect(await portfolio.managerFee()).to.equal(2000)
  })

  it('emits a ManagerFeeSet event', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)

    await expect(portfolio.connect(manager).setManagerFee(2000))
      .to.emit(portfolio, 'ManagerFeeChanged')
      .withArgs(2000)
  })

  it('only manager can set fees', async () => {
    const { portfolio, lender } = await loadFixture(managedPortfolioFixture)

    await expect(portfolio.connect(lender).setManagerFee(2000))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })
})
