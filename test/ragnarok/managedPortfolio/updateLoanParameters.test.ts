import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.updateLoanParameters', () => {
  const loadFixture = setupFixtureLoader()

  const loadUpdateLoanParametersFixture = async () => {
    const managedPortfolioFixtureData = await loadFixture(managedPortfolioFixture)
    const { depositIntoPortfolio, extractLoanId, portfolio, manager, borrower } = managedPortfolioFixtureData

    await depositIntoPortfolio(15)
    const loanId = await extractLoanId(portfolio.connect(manager)
      .createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))

    return {
      ...managedPortfolioFixtureData,
      loanId,
    }
  }

  it('loan new repaymentDate cannot be later than the portfolio endDate', async () => {
    const { portfolio, manager, loanId } = await loadUpdateLoanParametersFixture()

    const portfolioEndDate = await portfolio.endDate()
    await expect(
      portfolio.connect(manager)['updateLoanParameters(uint256,uint256,uint256)'](loanId, parseUSDC(11), portfolioEndDate.add(DAY)),
    ).to.be.revertedWith('ManagedPortfolio: Loan end date is greater than Portfolio end date')
  })

  it('updates portfolio latestRepaymentDate', async () => {
    const { portfolio, manager, loanId } = await loadUpdateLoanParametersFixture()

    const previousLatestRepaymentDate = await portfolio.latestRepaymentDate()
    await portfolio.connect(manager)['updateLoanParameters(uint256,uint256,uint256)'](loanId, parseUSDC(11), previousLatestRepaymentDate.add(DAY))
    expect(await portfolio.latestRepaymentDate()).to.equal(previousLatestRepaymentDate.add(DAY))
  })
})
