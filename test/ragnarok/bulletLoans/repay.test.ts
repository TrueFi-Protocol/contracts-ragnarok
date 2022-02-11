import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture } from '../fixtures'
import { parseUSDC } from 'utils'

describe('BulletLoans.repay', () => {
  const loadFixture = setupFixtureLoader()

  const loadRepayFixture = async () => {
    const bulletLoansFixtureData = await loadFixture(bulletLoansFixture)
    const loanId = await bulletLoansFixtureData.createLoan()
    return { ...bulletLoansFixtureData, loanId }
  }

  it('reverts when trying to repay non-existent loan', async () => {
    const { bulletLoans, borrower } = await loadRepayFixture()

    const invalidLoanId = 42
    await expect(bulletLoans.connect(borrower).repay(invalidLoanId, parseUSDC(6)))
      .to.be.revertedWith('BulletLoans: Cannot repay non-existent loan')
  })

  it('reverts when trying to repay a loan with status other than Issued', async () => {
    const { bulletLoans, portfolio, borrower, loanId } = await loadRepayFixture()

    await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
    await expect(bulletLoans.connect(borrower).repay(loanId, parseUSDC(6)))
      .to.be.revertedWith('BulletLoans: Can only repay issued loan')
    await bulletLoans.connect(portfolio).markLoanAsResolved(loanId)
    await expect(bulletLoans.connect(borrower).repay(loanId, parseUSDC(6)))
      .to.be.revertedWith('BulletLoans: Can only repay issued loan')
  })

  it('reverts when trying to overpay a loan', async () => {
    const { bulletLoans, borrower, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    await expect(bulletLoans.connect(borrower).repay(loanId, parseUSDC(6).add(1)))
      .to.be.revertedWith('BulletLoans: Loan cannot be overpaid')
  })

  it('allows any externally-owned account to repay', async () => {
    const { bulletLoans, owner, token, loanId } = await loadRepayFixture()

    await token.mint(owner.address, parseUSDC(6))
    await token.connect(owner).approve(bulletLoans.address, parseUSDC(6))
    await expect(bulletLoans.connect(owner).repay(loanId, parseUSDC(6))).to.emit(bulletLoans, 'LoanRepaid').withArgs(loanId, parseUSDC(6))
  })

  it('emits LoanRepaid event', async () => {
    const { bulletLoans, borrower, loanId } = await loadRepayFixture()

    await expect(bulletLoans.connect(borrower).repay(loanId, parseUSDC(1))).to.emit(bulletLoans, 'LoanRepaid').withArgs(loanId, parseUSDC(1))
  })

  it('decreases unpaid debt', async () => {
    const { bulletLoans, borrower, loanId } = await loadRepayFixture()

    expect(await bulletLoans.unpaidDebt(0)).to.equal(parseUSDC(6))
    await bulletLoans.connect(borrower).repay(loanId, parseUSDC(1))
    expect(await bulletLoans.unpaidDebt(0)).to.equal(parseUSDC(5))
    await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
    expect(await bulletLoans.unpaidDebt(0)).to.equal(parseUSDC(0))
  })

  describe('underpayment', () => {
    it('transfers tokens to portfolio', async () => {
      const { bulletLoans, portfolio, borrower, token, loanId } = await loadRepayFixture()

      const borrowerBalanceBefore = await token.balanceOf(borrower.address)
      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(2))
      expect(await token.balanceOf(portfolio.address)).to.equal(parseUSDC(2))
      expect(await token.balanceOf(borrower.address)).to.equal(borrowerBalanceBefore.sub(parseUSDC(2)))
    })

    it('increases amount repaid for loan', async () => {
      const { bulletLoans, borrower, loanId } = await loadRepayFixture()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(2))
      expect((await bulletLoans.loans(loanId)).amountRepaid).to.equal(parseUSDC(2))
    })
  })

  describe('full repayment', () => {
    it('transfers tokens to portfolio', async () => {
      const { bulletLoans, portfolio, borrower, token, loanId } = await loadRepayFixture()

      const borrowerBalanceBefore = await token.balanceOf(borrower.address)
      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
      expect(await token.balanceOf(portfolio.address)).to.equal(parseUSDC(6))
      expect(await token.balanceOf(borrower.address)).to.equal(borrowerBalanceBefore.sub(parseUSDC(6)))
    })

    it('increases amount repaid for loan', async () => {
      const { bulletLoans, borrower, loanId } = await loadRepayFixture()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
      expect((await bulletLoans.loans(loanId)).amountRepaid).to.equal(parseUSDC(6))
    })

    it('emits LoanStatusChanged event', async () => {
      const { bulletLoans, borrower, loanId } = await loadRepayFixture()

      await expect(bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))).to.emit(bulletLoans, 'LoanStatusChanged').withArgs(loanId, 1)
    })

    it('changes status to FullyRepaid', async () => {
      const { bulletLoans, borrower, loanId } = await loadRepayFixture()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(6))
      expect(await bulletLoans.getStatus(loanId)).to.equal(1)
    })
  })
})
