import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { BulletLoanStatus } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.markLoanAsResolved', () => {
  const loadFixture = setupFixtureLoader()

  it('reverts if caller is not the manager', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(100)
    const defaultedLoanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    await portfolio.connect(manager).markLoanAsDefaulted(defaultedLoanId)

    await expect(portfolio.connect(borrower).markLoanAsResolved(defaultedLoanId))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('changes status of the loan to resolved', async () => {
    const { portfolio, bulletLoans, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(100)
    const defaultedLoanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    await portfolio.connect(manager).markLoanAsDefaulted(defaultedLoanId)

    expect((await bulletLoans.loans(defaultedLoanId)).status).to.equal(BulletLoanStatus.Defaulted)
    await portfolio.connect(manager).markLoanAsResolved(defaultedLoanId)
    expect((await bulletLoans.loans(defaultedLoanId)).status).to.equal(BulletLoanStatus.Resolved)
  })

  it('decreases defaulted loan counter', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(100)
    const defaultedLoanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    await portfolio.connect(manager).markLoanAsDefaulted(defaultedLoanId)

    const defaultedLoanId2 = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    await portfolio.connect(manager).markLoanAsDefaulted(defaultedLoanId2)

    expect(await portfolio.defaultedLoansCount()).to.equal(2)

    await portfolio.markLoanAsResolved(defaultedLoanId)
    expect(await portfolio.defaultedLoansCount()).to.equal(1)

    await portfolio.markLoanAsResolved(defaultedLoanId2)
    expect(await portfolio.defaultedLoansCount()).to.equal(0)
  })
})
