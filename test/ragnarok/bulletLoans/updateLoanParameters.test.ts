import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture, BulletLoanStatus as Status } from '../fixtures'
import { parseUSDC, YEAR } from 'utils'
import { DAY } from 'utils/constants'

describe('BulletLoans.updateLoanParameters', () => {
  const loadFixture = setupFixtureLoader()

  describe('without borrower signature', () => {
    it('reverts if caller is not the owner of the loan', async () => {
      const { borrower, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await expect(updateLoanParameters(borrower)(loanId, 0, 0))
        .to.be.revertedWith('BulletLoans: Caller is not the owner of the loan')
    })

    it('prevents from increasing total debt', async () => {
      const { bulletLoans, portfolio, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      const loanParameters = await bulletLoans.loans(loanId)
      await expect(updateLoanParameters(portfolio)(loanId, loanParameters.totalDebt.add(1), loanParameters.repaymentDate))
        .to.be.revertedWith('BulletLoans: Loan total debt cannot be increased without borrower consent')
    })

    it('prevents from decreasing repayment date', async () => {
      const { bulletLoans, portfolio, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      const loanParameters = await bulletLoans.loans(loanId)
      await expect(updateLoanParameters(portfolio)(loanId, loanParameters.totalDebt, loanParameters.repaymentDate.sub(1)))
        .to.be.revertedWith('BulletLoans: Loan end date cannot be decreased without borrower consent')
    })

    it('changes loans parameters', async () => {
      const { bulletLoans, portfolio, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      const loanParametersBefore = await bulletLoans.loans(loanId)
      await updateLoanParameters(portfolio)(loanId, loanParametersBefore.totalDebt.div(2), loanParametersBefore.repaymentDate.add(DAY))
      const loanParametersAfter = await bulletLoans.loans(loanId)
      expect(loanParametersAfter.totalDebt).to.equal(loanParametersBefore.totalDebt.div(2))
      expect(loanParametersAfter.repaymentDate).to.equal(loanParametersBefore.repaymentDate.add(DAY))
      expect(loanParametersAfter.duration).to.equal(loanParametersBefore.duration.add(DAY))
    })

    it('updates loan to FullyRepaid if totalDebt decreased past repaymentAmount', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await updateLoanParameters(portfolio)(loanId, parseUSDC(5), loanParametersBefore.repaymentDate)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.FullyRepaid)
    })

    it('emits LoanStatusChanged event if loan status changed to FullyRepaid', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await expect(updateLoanParameters(portfolio)(loanId, parseUSDC(5), loanParametersBefore.repaymentDate)).to.emit(bulletLoans, 'LoanStatusChanged').withArgs(loanId, Status.FullyRepaid)
    })

    it('does not change loan status if totalDebt not decreased past repaymentAmount', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await updateLoanParameters(portfolio)(loanId, parseUSDC(5.5), loanParametersBefore.repaymentDate)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.Issued)
    })

    it('does not change loan status if loan is not in Issued state', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, updateLoanParameters } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
      await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await updateLoanParameters(portfolio)(loanId, parseUSDC(5), loanParametersBefore.repaymentDate)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.Defaulted)
    })
  })

  describe('with borrower signature', () => {
    it('reverts if caller is not the owner of the loan', async () => {
      const { borrower, createLoan, updateLoanParametersWithSignature } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await expect(updateLoanParametersWithSignature(borrower)(loanId, 0, 0, '0x'))
        .to.be.revertedWith('BulletLoans: Caller is not the owner of the loan')
    })

    it('reverts if borrower signature does not match new parameters', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, signNewParameters, updateLoanParametersWithSignature } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      const loanParameters = await bulletLoans.loans(loanId)
      const signature = await signNewParameters(borrower, loanId, loanParameters.totalDebt.mul(2), loanParameters.repaymentDate.sub(DAY))

      await expect(updateLoanParametersWithSignature(portfolio)(loanId, loanParameters.totalDebt.mul(3), loanParameters.repaymentDate.sub(DAY), signature))
        .to.be.revertedWith('BulletLoans: Signature is invalid')

      await expect(updateLoanParametersWithSignature(portfolio)(loanId, loanParameters.totalDebt.mul(2), loanParameters.repaymentDate.sub(DAY * 2), signature))
        .to.be.revertedWith('BulletLoans: Signature is invalid')
    })

    it('updates loan to FullyRepaid if totalDebt decreased past repaymentAmount', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, signNewParameters, updateLoanParametersWithSignature } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))

      const loanParameters = await bulletLoans.loans(loanId)
      const signature = await signNewParameters(borrower, loanId, parseUSDC(5), loanParameters.repaymentDate)

      await updateLoanParametersWithSignature(portfolio)(loanId, parseUSDC(5), loanParameters.repaymentDate, signature)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.FullyRepaid)
    })

    it('does not change loan status if totalDebt not decreased past repaymentAmount', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, signNewParameters, updateLoanParametersWithSignature } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))

      const loanParameters = await bulletLoans.loans(loanId)
      const signature = await signNewParameters(borrower, loanId, parseUSDC(5.5), loanParameters.repaymentDate)

      await updateLoanParametersWithSignature(portfolio)(loanId, parseUSDC(5.5), loanParameters.repaymentDate, signature)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.Issued)
    })

    it('does not change loan status if loan is not in Issued state', async () => {
      const { bulletLoans, portfolio, borrower, createLoan, signNewParameters, updateLoanParametersWithSignature } = await loadFixture(bulletLoansFixture)
      const loanId = await createLoan()

      await bulletLoans.connect(borrower).repay(loanId, parseUSDC(5))
      await bulletLoans.connect(portfolio).markLoanAsDefaulted(loanId)

      const loanParameters = await bulletLoans.loans(loanId)
      const signature = await signNewParameters(borrower, loanId, parseUSDC(5), loanParameters.repaymentDate)

      await updateLoanParametersWithSignature(portfolio)(loanId, parseUSDC(5), loanParameters.repaymentDate, signature)
      expect(await bulletLoans.getStatus(loanId)).to.equal(Status.Defaulted)
    })

    describe('allows to change loan parameters', () => {
      it('does not allow repayment date to be decreased past start date', async () => {
        const { bulletLoans, createLoan, signNewParameters, borrower, updateLoanParametersWithSignature, portfolio } = await loadFixture(bulletLoansFixture)
        const loanId = await createLoan()

        const loanParametersBefore = await bulletLoans.loans(loanId)
        const signature = await signNewParameters(borrower, loanId, loanParametersBefore.totalDebt, loanParametersBefore.repaymentDate.sub(YEAR + DAY))
        await expect(updateLoanParametersWithSignature(portfolio)(loanId, loanParametersBefore.totalDebt, loanParametersBefore.repaymentDate.sub(YEAR + DAY), signature)).to.be.revertedWith('BulletLoans: repayment date cannot be less than start date')
      })

      it('allows total debt increase', async () => {
        const { testParamsChange, createLoan } = await loadFixture(bulletLoansFixture)
        const loanId = await createLoan()
        await testParamsChange(100, 0, loanId)
      })
      it('allows total debt decrease', async () => {
        const { testParamsChange, createLoan } = await loadFixture(bulletLoansFixture)
        const loanId = await createLoan()
        await testParamsChange(-100, 0, loanId)
      })
      it('allows end date increase', async () => {
        const { testParamsChange, createLoan } = await loadFixture(bulletLoansFixture)
        const loanId = await createLoan()
        await testParamsChange(0, DAY, loanId)
      })
      it('allows end date decrease', async () => {
        const { testParamsChange, createLoan } = await loadFixture(bulletLoansFixture)
        const loanId = await createLoan()
        await testParamsChange(0, -DAY, loanId)
      })
    })
  })
})
