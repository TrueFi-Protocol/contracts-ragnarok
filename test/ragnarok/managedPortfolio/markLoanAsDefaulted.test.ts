import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { BulletLoanStatus } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.markLoanAsDefaulted', () => {
  const loadFixture = setupFixtureLoader()

  it('reverts if caller is not the manager', async () => {
    const { portfolio, lender, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const loanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))

    await expect(portfolio.connect(lender).markLoanAsDefaulted(loanId))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('changes status of the loan to defaulted', async () => {
    const { portfolio, bulletLoans, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const loanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))

    expect((await bulletLoans.loans(loanId)).status).to.equal(BulletLoanStatus.Issued)
    await portfolio.connect(manager).markLoanAsDefaulted(loanId)
    expect((await bulletLoans.loans(loanId)).status).to.equal(BulletLoanStatus.Defaulted)
  })

  it('increases defaulted loan counter', async () => {
    const { portfolio, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(100)
    const loanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    const loanId2 = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))

    await portfolio.markLoanAsDefaulted(loanId)
    expect(await portfolio.defaultedLoansCount()).to.equal(1)

    await portfolio.markLoanAsDefaulted(loanId2)
    expect(await portfolio.defaultedLoansCount()).to.equal(2)
  })

  it('emits event', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const loanId = await extractLoanId(portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
    await expect(portfolio.connect(manager).markLoanAsDefaulted(loanId)).to.emit(portfolio, 'BulletLoanDefaulted').withArgs(loanId)
  })
})
