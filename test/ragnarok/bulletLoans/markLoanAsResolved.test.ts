import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture, BulletLoanStatus as Status } from '../fixtures'

describe('BulletLoans.markLoanAsResolved', () => {
  const loadFixture = setupFixtureLoader()

  it('cannot mark non-existent loan', async () => {
    const { bulletLoans, portfolio } = await loadFixture(bulletLoansFixture)

    const invalidId = 42
    await expect(bulletLoans.connect(portfolio).markLoanAsResolved(invalidId))
      .to.be.revertedWith('ERC721: owner query for nonexistent token')
  })

  it('reverts if caller is not the owner of the loan', async () => {
    const { bulletLoans, borrower, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await expect(bulletLoans.connect(borrower).markLoanAsResolved(loanId))
      .to.be.revertedWith('BulletLoans: Caller is not the owner of the loan')
  })

  it('can mark only defaulted loan', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await expect(bulletLoans.connect(portfolio).markLoanAsResolved(loanId))
      .to.be.revertedWith('BulletLoans: Cannot resolve not defaulted loan')

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
    await bulletLoans.connect(portfolio).markLoanAsResolved(loanId)

    await expect(bulletLoans.connect(portfolio).markLoanAsResolved(loanId))
      .to.be.revertedWith('BulletLoans: Cannot resolve not defaulted loan')
  })

  it('changes loan status', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)

    expect((await bulletLoans.loans(loanId)).status).to.equal(Status.Defaulted)
    await bulletLoans.connect(portfolio).markLoanAsResolved(loanId)
    expect((await bulletLoans.loans(loanId)).status).to.equal(Status.Resolved)
  })

  it('emits event', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)

    await expect(bulletLoans.connect(portfolio).markLoanAsResolved(loanId))
      .to.emit(bulletLoans, 'LoanStatusChanged')
      .withArgs(loanId, Status.Resolved)
  })
})
