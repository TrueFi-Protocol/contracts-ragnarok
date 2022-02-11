import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.value', () => {
  const loadFixture = setupFixtureLoader()

  it('is 0 when portfolio is empty', async () => {
    const { portfolio } = await loadFixture(managedPortfolioFixture)
    expect(await portfolio.value()).to.eq(0)
  })

  it('returns only liquid value', async () => {
    const { portfolio, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(10)
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(10))
    expect(await portfolio.value()).to.equal(parseUSDC(10))
  })

  it('returns only illiquidValue', async () => {
    const { portfolio, protocolConfig, manager, protocolOwner, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.connect(manager).setManagerFee(0)

    await depositIntoPortfolio(10)
    await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
    expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 5)
    expect(await portfolio.value()).to.be.closeTo(parseUSDC(10), 5)
  })

  it('combines liquid and illiquid values', async () => {
    const { portfolio, protocolConfig, manager, protocolOwner, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.connect(manager).setManagerFee(0)

    await depositIntoPortfolio(20)
    await portfolio.connect(manager).createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
    expect(await portfolio.liquidValue()).to.equal(parseUSDC(10))
    expect(await portfolio.illiquidValue()).to.be.closeTo(parseUSDC(10), 5)
    expect(await portfolio.value()).to.be.closeTo(parseUSDC(20), 5)
  })

  it('does not include defaulted loans in value', async () => {
    const { portfolio, protocolConfig, manager, protocolOwner, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.connect(manager).setManagerFee(0)

    await depositIntoPortfolio(20)
    await portfolio.createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
    await portfolio.createBulletLoan(30 * DAY, borrower.address, parseUSDC(10), parseUSDC(11))
    expect(await portfolio.value()).to.be.closeTo(parseUSDC(20), 5)
    await portfolio.connect(manager).markLoanAsDefaulted(0)
    expect(await portfolio.value()).to.be.closeTo(parseUSDC(10), 5)
  })
})
