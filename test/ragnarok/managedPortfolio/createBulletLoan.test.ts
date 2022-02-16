import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'
import { YEAR, DAY } from 'utils/constants'

describe('ManagedPortfolio.createBulletLoan', () => {
  const loadFixture = setupFixtureLoader()

  it('transfers funds to the borrower', async () => {
    const { portfolio, borrower, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await portfolio.createBulletLoan(DAY * 30, borrower.address, parseUSDC(5), parseUSDC(6))

    expect(await token.balanceOf(borrower.address)).to.equal(parseUSDC(5))
  })

  it('emits a proper event', async () => {
    const { portfolio, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await expect(portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
      .to.emit(portfolio, 'BulletLoanCreated')
      .withArgs(0, DAY, borrower.address, parseUSDC(5), parseUSDC(6))
  })

  it('mints an NFT', async () => {
    const { portfolio, bulletLoans, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(5), parseUSDC(6))
    expect(await bulletLoans.ownerOf(0)).to.equal(portfolio.address)
  })

  it('cannot create a loan after portfolio endDate', async () => {
    const { portfolio, borrower, timeTravel } = await loadFixture(managedPortfolioFixture)

    await timeTravel(YEAR)
    await expect(portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(5), parseUSDC(6)))
      .to.be.revertedWith('ManagedPortfolio: Cannot create loan when Portfolio is closed')
  })

  it('cannot create a loan with the endDate greater than Portfolio endDate', async () => {
    const { portfolio, borrower } = await loadFixture(managedPortfolioFixture)

    await expect(portfolio.createBulletLoan(YEAR + 1, borrower.address, parseUSDC(5), parseUSDC(6)))
      .to.be.revertedWith('ManagedPortfolio: Loan end date is greater than Portfolio end date')
  })

  it.skip('cannot create a loan when a max loans number is reached', async () => {
    const { portfolio, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(1_000_000)

    const maxLoansNumber = await portfolio.MAX_LOANS_NUMBER()
    const loanArgs = [DAY, borrower.address, parseUSDC(5), parseUSDC(6)] as const

    for (let i = 0; i < maxLoansNumber.toNumber(); i++) {
      await portfolio.createBulletLoan(...loanArgs)
    }

    await expect(portfolio.createBulletLoan(...loanArgs)).to.be.revertedWith('ManagedPortfolio: Maximum loans number has been reached')
  })

  it('only manager can create a loan', async () => {
    const { portfolio, borrower } = await loadFixture(managedPortfolioFixture)

    await expect(portfolio.connect(borrower).createBulletLoan(YEAR + 1, borrower.address, parseUSDC(5), parseUSDC(6)))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('transfers manager fee to the manager', async () => {
    const { portfolio, manager, borrower, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(1_000_000)
    await portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(500_000), parseUSDC(560_000))
    expect(await token.balanceOf(manager.address)).to.equal(parseUSDC(205.479452))
  })

  it('transfers protocol fee to the protocol', async () => {
    const { portfolio, protocol, borrower, token, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(1_000_000)
    await portfolio.createBulletLoan(15 * DAY, borrower.address, parseUSDC(500_000), parseUSDC(560_000))
    expect(await token.balanceOf(protocol.address)).to.equal(parseUSDC(51.369863))
  })

  it('getOpenLoanIds returns a list of loans', async () => {
    const { portfolio, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)

    await depositIntoPortfolio(10)
    await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(3), parseUSDC(6))
    await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(3), parseUSDC(6))

    expect(await portfolio.getOpenLoanIds()).to.deep.equal([BigNumber.from(0), BigNumber.from(1)])
  })

  it('can be created even after another loan has defaulted', async () => {
    const { portfolio, manager, borrower, depositIntoPortfolio } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)

    await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(3), parseUSDC(6))
    await portfolio.connect(manager).markLoanAsDefaulted(0)
    await expect(portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(3), parseUSDC(6))).to.not.be.reverted
  })

  it('increases latestRepaymentDate upon creation of first loan', async () => {
    const { portfolio, borrower, depositIntoPortfolio, getTxTimestamp } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const tx = await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(1), parseUSDC(1))
    const firstLoanCreationTimestamp = await getTxTimestamp(tx)

    expect(await portfolio.latestRepaymentDate()).to.equal(firstLoanCreationTimestamp + DAY)
  })

  it('increases latestRepaymentDate if a new loan default date exceeds it', async () => {
    const { portfolio, borrower, depositIntoPortfolio, getTxTimestamp } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const tx = await portfolio.createBulletLoan(DAY * 2, borrower.address, parseUSDC(1), parseUSDC(1))
    const loanCreationTimestamp = await getTxTimestamp(tx)

    expect(await portfolio.latestRepaymentDate()).to.equal(loanCreationTimestamp + DAY * 2)
  })

  it('does not increase latestRepaymentDate when a new loan default date does not exceed it', async () => {
    const { portfolio, borrower, depositIntoPortfolio, getTxTimestamp } = await loadFixture(managedPortfolioFixture)
    await depositIntoPortfolio(10)
    const tx = await portfolio.createBulletLoan(DAY, borrower.address, parseUSDC(1), parseUSDC(1))
    const firstLoanCreationTimestamp = await getTxTimestamp(tx)

    await portfolio.createBulletLoan(DAY / 2, borrower.address, parseUSDC(1), parseUSDC(1))
    expect(await portfolio.latestRepaymentDate()).to.equal(firstLoanCreationTimestamp + DAY)
  })
})
