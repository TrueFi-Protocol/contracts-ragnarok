import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { DAY } from 'utils/constants'

describe('ManagedPortfolio.maxSize', () => {
  const loadFixture = setupFixtureLoader()

  it('prevents deposit if total after deposit > maxSize', async () => {
    const { portfolio, lender, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await portfolio.setMaxSize(0)
    await expect(depositIntoPortfolio(10, lender)).to.be.revertedWith('ManagedPortfolio: Portfolio is full')
  })

  it('allows deposit if total after deposit = maxSize', async () => {
    const { portfolio, lender, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(100))

    await portfolio.setMaxSize(parseUSDC(100))
    await expect(depositIntoPortfolio(100, lender)).not.to.be.reverted
  })

  it('allows multiple deposits until total after deposit > maxSize', async () => {
    const { portfolio, lender, lender2, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await token.mint(lender.address, parseUSDC(100))
    await token.mint(lender2.address, parseUSDC(50))

    await portfolio.setMaxSize(parseUSDC(100))
    await expect(depositIntoPortfolio(50, lender)).not.to.be.reverted
    await expect(depositIntoPortfolio(50, lender2)).not.to.be.reverted
    await expect(depositIntoPortfolio(50, lender)).to.be.revertedWith('ManagedPortfolio: Portfolio is full')
  })

  it('whether portfolio is full depends on total amount deposited, not amount of underlying token', async () => {
    const { portfolio, manager, protocolConfig, protocolOwner, lender, borrower, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await portfolio.connect(manager).setManagerFee(0)
    await protocolConfig.connect(protocolOwner).setProtocolFee(0)
    await portfolio.setMaxSize(parseUSDC(110))
    await depositIntoPortfolio(100)
    await portfolio.createBulletLoan(DAY * 30, borrower.address, parseUSDC(100), parseUSDC(106))

    await token.mint(lender.address, parseUSDC(100))
    await expect(depositIntoPortfolio(100, lender)).to.be.revertedWith('ManagedPortfolio: Portfolio is full')
  })

  it('only manager is allowed to change maxSize', async () => {
    const { portfolio, manager, lender } = await loadFixture(managedPortfolioFixture)

    await expect(portfolio.connect(lender).setMaxSize(0)).to.be.revertedWith('Manageable: Caller is not the manager')
    await expect(portfolio.connect(manager).setMaxSize(0)).not.to.be.reverted
  })

  it('emits event', async () => {
    const { portfolio, manager } = await loadFixture(managedPortfolioFixture)
    await expect(portfolio.connect(manager).setMaxSize(10)).to.emit(portfolio, 'MaxSizeChanged').withArgs(10)
  })
})
