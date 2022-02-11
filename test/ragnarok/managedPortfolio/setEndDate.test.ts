import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { YEAR, DAY } from 'utils/constants'

describe('ManagedPortfolio.setEndDate', () => {
  const loadFixture = setupFixtureLoader()

  it('only allows manager to modify end date', async () => {
    const { portfolio, manager, lender } = await loadFixture(managedPortfolioFixture)
    const currentEndDate = await portfolio.endDate()

    await expect(portfolio.connect(manager).setEndDate(currentEndDate.sub(DAY))).not.to.be.reverted
    await expect(portfolio.connect(lender).setEndDate(currentEndDate.sub(DAY)))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('only allows end date to be decreased', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)
    const currentEndDate = await portfolio.endDate()

    await expect(portfolio.connect(manager).setEndDate(currentEndDate.add(DAY)))
      .to.be.revertedWith('ManagedPortfolio: End date can only be decreased')
    await expect(portfolio.connect(manager).setEndDate(currentEndDate.sub(DAY)))
      .not.to.be.reverted
  })

  it('updates end date correctly', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)
    const currentEndDate = await portfolio.endDate()

    await portfolio.connect(manager).setEndDate(currentEndDate.sub(DAY))
    expect(await portfolio.endDate()).to.equal(currentEndDate.sub(DAY))
  })

  it('reverts when end date is set to less than max default date of all loans', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(10)
    await portfolio.connect(manager).createBulletLoan(YEAR / 2, borrower.address, parseUSDC(5), parseUSDC(6))
    const latestRepaymentDate = await portfolio.latestRepaymentDate()
    await expect(portfolio.connect(manager).setEndDate(0))
      .to.be.revertedWith('ManagedPortfolio: End date cannot be less than max loan default date')
    await expect(portfolio.connect(manager).setEndDate(latestRepaymentDate)).not.to.be.reverted
  })

  it('emits an EndDateChanged event', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)
    const currentEndDate = await portfolio.endDate()

    await expect(portfolio.connect(manager).setEndDate(currentEndDate.sub(DAY)))
      .to.emit(portfolio, 'EndDateChanged').withArgs(currentEndDate.sub(DAY))
  })
})
