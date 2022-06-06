import { MockUsdc__factory, MockUsdc } from 'build/types'
import { expect } from 'chai'
import { constants } from 'ethers'
import { tvl } from 'scripts/tvl'
import { setupFixtureLoader } from 'test/setup'
import { parseUSDC } from 'utils/parseUSDC'
import { signConfirmationMessage } from 'utils/signing'
import { managedPortfolioFactoryFixture } from './fixtures'

describe('TVL', () => {
  const loadFixture = setupFixtureLoader()
  it('returns 0 if no portfolios', async () => {
    const { factory } = await loadFixture(managedPortfolioFactoryFixture)
    expect(await tvl(factory)).to.deep.eq({})
  })

  it('returns proper tvl', async () => {
    const { factory, createPortfolio, manager, lenderVerifier, DEPOSIT_MESSAGE, token } = await loadFixture(managedPortfolioFactoryFixture)
    const { portfolio } = await createPortfolio()
    await token.mint(manager.address, parseUSDC(1000))
    await token.connect(manager).approve(portfolio.address, constants.MaxUint256)
    await portfolio.deposit(parseUSDC(1000), await signConfirmationMessage(manager, lenderVerifier.address, DEPOSIT_MESSAGE), { gasLimit: 999999 })

    const tvlEntries = await tvl(factory)

    expect(tvlEntries).to.have.property(token.address)
      .that.eq(parseUSDC(1000))
  })

  it('multiple tokens', async () => {
    const { factory, createPortfolio, manager, lenderVerifier, DEPOSIT_MESSAGE, token, wallet } = await loadFixture(managedPortfolioFactoryFixture)
    const token1 = await new MockUsdc__factory(wallet).deploy()

    async function createPortfolioAndDeposit(underlyingToken: MockUsdc) {
      const { portfolio } = await createPortfolio(underlyingToken.address)
      await underlyingToken.mint(manager.address, parseUSDC(1000))
      await underlyingToken.connect(manager).approve(portfolio.address, constants.MaxUint256)
      await portfolio.deposit(parseUSDC(1000), await signConfirmationMessage(manager, lenderVerifier.address, DEPOSIT_MESSAGE), { gasLimit: 999999 })
    }

    await createPortfolioAndDeposit(token)
    await createPortfolioAndDeposit(token)
    await createPortfolioAndDeposit(token)
    await createPortfolioAndDeposit(token)
    await createPortfolioAndDeposit(token1)

    const tvlEntries = await tvl(factory)

    expect(tvlEntries).to.have.property(token.address)
      .that.eq(parseUSDC(4000))
    expect(tvlEntries).to.have.property(token1.address)
      .that.eq(parseUSDC(1000))
  })
})
