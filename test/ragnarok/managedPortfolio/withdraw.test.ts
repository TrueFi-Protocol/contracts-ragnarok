import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { YEAR, DAY } from 'utils/constants'

describe('ManagedPortfolio.withdraw', () => {
  const loadFixture = setupFixtureLoader()

  it('cannot withdraw when portfolio is not closed', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(100))
    await depositIntoPortfolio(100, lender)

    await expect(portfolio.connect(lender).withdraw(parseShares(50), '0x'))
      .to.be.revertedWith('ManagedPortfolio: Portfolio is not closed')
  })

  it('sends tokens back to the lender', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares, timeTravel } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(4_000_000))

    await depositIntoPortfolio(4_000_000, lender)

    await timeTravel(YEAR + DAY)
    await portfolio.connect(lender).withdraw(parseShares(1_000_000), '0x')

    expect(await token.balanceOf(lender.address)).to.equal(parseUSDC(1_000_000))
  })

  it('burns proper amount of pool tokens', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares, timeTravel } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(100))

    await depositIntoPortfolio(100, lender)

    expect(await portfolio.totalSupply()).to.equal(parseShares(100))

    await timeTravel(YEAR + DAY)
    await portfolio.connect(lender).withdraw(parseShares(50), '0x')

    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(50))
    expect(await portfolio.totalSupply()).to.equal(parseShares(50))
  })

  it('sends correct number of tokens back to lender after portfolio value has grown', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares, timeTravel } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(4_000_000))

    await depositIntoPortfolio(4_000_000, lender)
    await token.mint(portfolio.address, parseUSDC(4_000_000)) // Double the pool value

    await timeTravel(YEAR + DAY)
    await portfolio.connect(lender).withdraw(parseShares(500_000), '0x')
    expect(await token.balanceOf(lender.address))
      .to.equal(parseUSDC(1_000_000))
    await portfolio.connect(lender).withdraw(parseShares(1_000_000), '0x')
    expect(await token.balanceOf(lender.address))
      .to.equal(parseUSDC(3_000_000))
  })

  it('sends correct number of tokens back to two lenders', async () => {
    const { portfolio, lender, lender2, token, depositIntoPortfolio, parseShares, timeTravel } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(4_000_000))
    await token.mint(lender2.address, parseUSDC(1_000_000))

    await depositIntoPortfolio(4_000_000, lender)
    await depositIntoPortfolio(1_000_000, lender2)
    await token.mint(portfolio.address, parseUSDC(1_000_000))

    await timeTravel(YEAR + DAY)
    await portfolio.connect(lender).withdraw(parseShares(2_000_000), '0x')
    expect(await token.balanceOf(lender.address)).to.equal(parseUSDC(2_400_000))
    await portfolio.connect(lender2).withdraw(parseShares(500_000), '0x')
    expect(await token.balanceOf(lender2.address)).to.equal(parseUSDC(600_000))
  })

  it('emits event', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares, timeTravel } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(100))

    await depositIntoPortfolio(100, lender)

    await timeTravel(YEAR + DAY)
    await expect(portfolio.connect(lender).withdraw(parseShares(50), '0x')).to.emit(portfolio, 'Withdrawn')
      .withArgs(lender.address, parseShares(50), parseUSDC(50))
  })
})
