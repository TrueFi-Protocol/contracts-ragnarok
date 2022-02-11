import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.liquidValue', () => {
  const loadFixture = setupFixtureLoader()

  it('is 0 when portfolio is empty', async () => {
    const { portfolio } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.liquidValue()).to.equal(0)
  })

  it('grows with deposits', async () => {
    const { portfolio, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(5)
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(5))
    await depositIntoPortfolio(10)
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(15))
  })

  it('decreases when issuing loan', async () => {
    const { portfolio, protocolConfig, manager, protocolOwner, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.connect(manager).setManagerFee(0)

    await depositIntoPortfolio(20)
    await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(10))
  })

  it('increases when loan is repaid', async () => {
    const { portfolio, protocolConfig, manager, protocolOwner, borrower, depositIntoPortfolio, extractLoanId, repayLoan } = await loadFixture(managedPortfolioFixture)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.connect(manager).setManagerFee(0)

    await depositIntoPortfolio(20)
    const loanId = await extractLoanId(portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11)))
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(10))
    await repayLoan(loanId, 5)
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(15))
  })
})
