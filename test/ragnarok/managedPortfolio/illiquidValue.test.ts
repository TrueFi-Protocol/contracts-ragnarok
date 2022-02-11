import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC, timeTravel } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.illiquidValue', () => {
  const loadFixture = setupFixtureLoader()

  it('is 0 when portfolio has no loans', async () => {
    const { portfolio, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(50)

    expect(await portfolio.illiquidValue()).to.equal(0)
  })

  describe('one loan scenarios', () => {
    it('is principal when new loan issued', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 10)
    })

    it('accrues interest linearly', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))

      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1), 10)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.2), 10)
    })

    it('is total debt when loan repayment date is elapsed', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))

      await timeTravel(DAY * 30)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11), 10)
      await timeTravel(DAY)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11), 10)
    })

    it('accounts for partial repayments', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel, repayLoan, extractLoanId } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 10)
      await repayLoan(loanId, 5)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10 - 5), 10)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1 - 5), 10)
    })

    it('accounts for full repayments', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel, repayLoan, extractLoanId } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 10)
      await repayLoan(loanId, 11)
      expect(await portfolio.illiquidValue()).to.equal(0)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.equal(0)
      await timeTravel(DAY * 27)
      expect(await portfolio.illiquidValue()).to.equal(0)
    })

    it('doesn\'t include defaulted or resolved loans', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 10)
      await portfolio.connect(manager).markLoanAsDefaulted(loanId)
      expect(await portfolio.illiquidValue()).to.equal(0)
      await portfolio.connect(manager).markLoanAsResolved(loanId)
      expect(await portfolio.illiquidValue()).to.equal(0)
    })

    it('updates properly when loan repayment date is changed', async () => {
      const { portfolio, manager, provider, bulletLoans, extractLoanId, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      await timeTravel(provider, DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1), 10)
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await portfolio.connect(manager)['updateLoanParameters(uint256,uint256,uint256)'](loanId, loanParametersBefore.totalDebt, loanParametersBefore.repaymentDate.add(DAY * 30))
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.05), 10)
    })

    it('updates properly when loan totalDebt is changed', async () => {
      const { portfolio, manager, provider, bulletLoans, extractLoanId, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      await timeTravel(provider, DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1), 10)
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await portfolio.connect(manager)['updateLoanParameters(uint256,uint256,uint256)'](loanId, parseUSDC(10.5), loanParametersBefore.repaymentDate)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.05), 10)
    })

    it('updates properly when loan status is changed to FullyRepaid', async () => {
      const { portfolio, manager, provider, bulletLoans, extractLoanId, borrower, repayLoan, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      await timeTravel(provider, DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1), 10)
      await repayLoan(loanId, 10.5)
      const loanParametersBefore = await bulletLoans.loans(loanId)
      await portfolio.connect(manager)['updateLoanParameters(uint256,uint256,uint256)'](loanId, parseUSDC(10.5), loanParametersBefore.repaymentDate)
      expect(await portfolio.illiquidValue()).to.equal(0)
    })

    it('if loan total debt is lower than principal, value is always equal to the debt', async () => {
      const { portfolio, manager, provider, bulletLoans, extractLoanId, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

      const loanParametersBefore = await bulletLoans.loans(loanId)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 10)
      await portfolio['updateLoanParameters(uint256,uint256,uint256)'](loanId, parseUSDC(9), loanParametersBefore.repaymentDate)
      expect(await portfolio.illiquidValue()).to.equal(parseUSDC(9))
      await timeTravel(provider, DAY * 3)
      expect(await portfolio.illiquidValue()).to.equal(parseUSDC(9))
    })
  })

  describe('two loan scenarios', () => {
    it('is sum of newly issued loans principals', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
      await portfolio.connect(manager).createBulletLoan(60 * DAY, borrower.address, parseUSDC(20), parseUSDC(30))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10 + 20), 20)
    })

    it('accrues interest linearly, according to repayment dates', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
      await portfolio.connect(manager).createBulletLoan(60 * DAY, borrower.address, parseUSDC(20), parseUSDC(30))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10 + 20), 20)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.1 + 20.5), 20)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10.2 + 21), 20)
      await timeTravel(DAY * 24)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11 + 25), 20)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11 + 25.5), 20)
      await timeTravel(DAY * 27)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11 + 30), 20)
      await timeTravel(DAY)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(11 + 30), 20)
    })

    it('accounts for repayments', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId, repayLoan, timeTravel } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const firstLoanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))
      const secondLoanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(60 * DAY, borrower.address, parseUSDC(20), parseUSDC(30)))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10 + 20), 20)
      await repayLoan(firstLoanId, 5)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(5 + 20), 20)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(5.1 + 20.5), 20)
      await repayLoan(secondLoanId, 10)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(5.1 + 10.5), 20)
      await repayLoan(firstLoanId, 6)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(0 + 10.5), 20)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(0 + 11), 20)
      await repayLoan(secondLoanId, 5)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(0 + 6), 20)
    })

    it('doesn\'t include defaulted or resolved loans', async () => {
      const { portfolio, manager, borrower, depositIntoPortfolio, extractLoanId, timeTravel } = await loadFixture(managedPortfolioFixture)
      await depositIntoPortfolio(50)
      const firstLoanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))
      const secondLoanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(60 * DAY, borrower.address, parseUSDC(20), parseUSDC(30)))

      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10 + 20), 20)
      await portfolio.connect(manager).markLoanAsDefaulted(firstLoanId)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(20), 10)
      await portfolio.connect(manager).markLoanAsResolved(firstLoanId)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(20), 10)
      await timeTravel(DAY * 3)
      expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(20.5), 10)
      await portfolio.connect(manager).markLoanAsDefaulted(secondLoanId)
      expect(await portfolio.illiquidValue()).to.equal(0)
      await portfolio.connect(manager).markLoanAsResolved(secondLoanId)
      expect(await portfolio.illiquidValue()).to.equal(0)
    })
  })
})
