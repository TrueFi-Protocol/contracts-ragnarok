import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture, BulletLoanStatus as Status } from '../fixtures'
import { parseUSDC } from 'utils/parseUSDC'
import { YEAR } from 'utils/constants'

describe('BulletLoans.markLoanAsDefaulted', () => {
  const loadFixture = setupFixtureLoader()

  it('cannot mark non-existent loan', async () => {
    const { bulletLoans, portfolio } = await loadFixture(bulletLoansFixture)

    const invalidId = 42
    await expect(bulletLoans.connect(portfolio).markLoanAsDefaulted(invalidId))
      .to.be.revertedWith('ERC721: owner query for nonexistent token')
  })

  it('cannot mark fully repaid loan', async () => {
    const { bulletLoans, portfolio, borrower, token, extractLoanId } = await loadFixture(bulletLoansFixture)
    const loanId = await extractLoanId(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address))

    await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
    await expect(bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId))
      .to.be.revertedWith('BulletLoans: Loan is not in issued state')
  })

  it('cannot mark already defaulted loan', async () => {
    const { bulletLoans, portfolio, borrower, token, extractLoanId } = await loadFixture(bulletLoansFixture)
    const loanId = await extractLoanId(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address))

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
    await expect(bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId))
      .to.be.revertedWith('BulletLoans: Loan is not in issued state')
  })

  it('cannot mark resolved loan', async () => {
    const { bulletLoans, portfolio, borrower, token, extractLoanId } = await loadFixture(bulletLoansFixture)
    const loanId = await extractLoanId(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address))

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
    await bulletLoans.connect(portfolio).markLoanAsResolved(loanId)
    await expect(bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId))
      .to.be.revertedWith('BulletLoans: Loan is not in issued state')
  })

  it('reverts if caller is not the owner of the loan', async () => {
    const { bulletLoans, borrower, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await expect(bulletLoans.connect(borrower).markLoanAsDefaulted(loanId))
      .to.be.revertedWith('BulletLoans: Caller is not the owner of the loan')
  })

  it('changes loan status', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
    expect((await bulletLoans.loans(loanId)).status).to.equal(Status.Defaulted)
  })

  it('emits event', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await expect(bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId))
      .to.emit(bulletLoans, 'LoanStatusChanged')
      .withArgs(loanId, Status.Defaulted)
  })
})
