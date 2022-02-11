import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture, BulletLoanStatus as Status } from '../fixtures'
import { parseUSDC } from 'utils'

describe('BulletLoans.getStatus', () => {
  const loadFixture = setupFixtureLoader()

  it('returns "Issued" for a newly-issued loan', async () => {
    const { bulletLoans, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    expect(await bulletLoans.getStatus(loanId)).to.equal(Status.Issued)
  })

  it('returns "FullyRepaid" for a loan that has been repaid in full', async () => {
    const { bulletLoans, borrower, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
    expect(await bulletLoans.getStatus(loanId)).to.equal(Status.FullyRepaid)
  })

  it('returns the correct status for multiple loans', async () => {
    const { bulletLoans, borrower, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
    expect(await bulletLoans.getStatus(loanId)).to.equal(Status.FullyRepaid)
    const newLoanId = await createLoan()
    expect(await bulletLoans.getStatus(newLoanId)).to.equal(Status.Issued)
  })

  it('reverts when trying to get status for a non-existent loan', async () => {
    const { bulletLoans } = await loadFixture(bulletLoansFixture)
    const invalidLoanId = 42

    await expect(bulletLoans.getStatus(invalidLoanId))
      .to.be.revertedWith('BulletLoans: Cannot get status of non-existent loan')
  })
})
