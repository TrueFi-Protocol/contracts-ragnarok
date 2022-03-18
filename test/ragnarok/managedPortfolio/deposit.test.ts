import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { YEAR, DAY } from 'utils/constants'
import { utils } from 'ethers'

describe('ManagedPortfolio.deposit', () => {
  const loadFixture = setupFixtureLoader()

  it('lender cannot deposit after portfolio endDate', async () => {
    const { portfolio, lender, token, DEPOSIT_MESSAGE, timeTravel, signMessage } = await loadFixture(managedPortfolioFixture)

    await timeTravel(YEAR + DAY)
    await token.connect(lender).approve(portfolio.address, parseUSDC(10))
    const signature = await signMessage(lender, DEPOSIT_MESSAGE)
    await expect(portfolio.connect(lender).deposit(parseUSDC(10), signature))
      .to.be.revertedWith('ManagedPortfolio: Portfolio is not opened')
  })

  it('reverts if lender signature is invalid', async () => {
    const { portfolio, lender, signMessage } = await loadFixture(managedPortfolioFixture)

    const signature = await signMessage(lender, 'other message')
    await expect(portfolio.connect(lender).deposit(parseUSDC(10), signature))
      .to.be.revertedWith('ManagedPortfolio: Lender is not allowed to deposit')
  })

  it('transfers tokens to portfolio', async () => {
    const { portfolio, lender, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))

    await depositIntoPortfolio(10, lender)
    expect(await token.balanceOf(portfolio.address)).to.equal(parseUSDC(10))
  })

  it('issues portfolio share tokens', async () => {
    const { portfolio, lender, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))

    await depositIntoPortfolio(10, lender)
    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(10))
  })

  it('issues tokens for the second lender', async () => {
    const { portfolio, lender, lender2, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))
    await token.mint(lender2.address, parseUSDC(10))

    await depositIntoPortfolio(10, lender)
    await depositIntoPortfolio(10, lender2)
    expect(await portfolio.balanceOf(lender2.address)).to.equal(parseShares(10))
  })

  it('issues correct shares after pool value grows', async () => {
    const { portfolio, lender, lender2, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))
    await token.mint(lender2.address, parseUSDC(10))

    await depositIntoPortfolio(10, lender)
    await token.mint(portfolio.address, parseUSDC(5))

    await depositIntoPortfolio(10, lender2)

    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(10))
    expect(await portfolio.balanceOf(lender2.address))
      .to.equal(parseShares(10).mul(10).div(15))
  })

  it('issues fewer shares per token deposited after the pool value grows', async () => {
    const { portfolio, lender, lender2, lender3, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(20))
    await token.mint(lender2.address, parseUSDC(50))
    await token.mint(lender3.address, parseUSDC(20))

    await depositIntoPortfolio(10, lender)
    await depositIntoPortfolio(30, lender2)
    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(10))
    expect(await portfolio.balanceOf(lender2.address)).to.equal(parseShares(30))

    await token.mint(portfolio.address, parseUSDC(40)) // Doubles the pool value

    await depositIntoPortfolio(10, lender)
    await depositIntoPortfolio(20, lender2)
    await depositIntoPortfolio(20, lender3)
    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(10 + 5))
    expect(await portfolio.balanceOf(lender2.address)).to.equal(parseShares(30 + 10))
    expect(await portfolio.balanceOf(lender3.address)).to.equal(parseShares(10))
  })

  it('causes totalDeposited to increase', async () => {
    const { portfolio, lender, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))

    expect(await portfolio.totalDeposited()).to.equal(parseUSDC(0))
    await depositIntoPortfolio(10, lender)
    expect(await portfolio.totalDeposited()).to.equal(parseUSDC(10))
  })

  it('cannot deposit after loan has defaulted', async () => {
    const { portfolio, manager, lender, borrower, token, DEPOSIT_MESSAGE, depositIntoPortfolio, signMessage } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))

    await depositIntoPortfolio(10, lender)
    await portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(5), parseUSDC(6))
    await portfolio.connect(manager).markLoanAsDefaulted(0)
    await token.connect(lender).approve(portfolio.address, parseUSDC(10))
    const signature = await signMessage(lender, DEPOSIT_MESSAGE)
    await expect(portfolio.connect(lender).deposit(parseUSDC(10), signature))
      .to.be.revertedWith('ManagedPortfolio: Portfolio is not opened')
  })

  it('emits event', async () => {
    const { portfolio, lender, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))

    await expect(depositIntoPortfolio(10, lender))
      .to.emit(portfolio, 'Deposited')
      .withArgs(lender.address, parseUSDC(10))
  })

  it('requires minimum deposit amount', async () => {
    const { portfolio, lender, token, signMessage, DEPOSIT_MESSAGE } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(10))
    await token.connect(lender).approve(portfolio.address, parseUSDC(1))
    const signature = await signMessage(lender, DEPOSIT_MESSAGE)
    await expect(portfolio.connect(lender).deposit(1, signature)).to.be.revertedWith('ManagedPortfolio: Deposit amount is too small')
    await portfolio.connect(lender).deposit(parseUSDC(1), signature)
    expect(await portfolio.balanceOf(lender.address)).to.eq(utils.parseEther('1'))
  })
})
