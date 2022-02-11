import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture, ManagedPortfolioStatus as Status } from '../fixtures'
import { parseUSDC } from 'utils'
import { YEAR, DAY } from 'utils/constants'

describe('ManagedPortfolio.getStatus', () => {
  const loadFixture = setupFixtureLoader()

  it('is Open before endDate when no loans have defaulted', async () => {
    const { portfolio, timeTravel } = await loadFixture(managedPortfolioFixture)

    expect(await portfolio.getStatus()).to.equal(Status.Open)
    await timeTravel(YEAR - DAY)
    expect(await portfolio.getStatus()).to.equal(Status.Open)
  })

  it('is Frozen when any loan has defaulted', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6))
    expect(await portfolio.getStatus()).to.equal(Status.Open)
    await portfolio.connect(manager).markLoanAsDefaulted(0)
    expect(await portfolio.getStatus()).to.equal(Status.Frozen)
  })

  it('is Closed after endDate', async () => {
    const { portfolio, timeTravel } = await loadFixture(managedPortfolioFixture)

    await timeTravel(YEAR + DAY)
    expect(await portfolio.getStatus()).to.equal(Status.Closed)
  })

  it('is Closed after endDate with defaulted loans', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio, timeTravel } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6))
    expect(await portfolio.getStatus()).to.equal(Status.Open)
    await portfolio.connect(manager).markLoanAsDefaulted(0)
    expect(await portfolio.getStatus()).to.equal(Status.Frozen)
    await timeTravel(YEAR + DAY)
    expect(await portfolio.getStatus()).to.equal(Status.Closed)
  })
})
