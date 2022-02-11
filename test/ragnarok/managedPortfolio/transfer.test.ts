import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { parseUSDC } from 'utils'

describe('ManagedPortfolio.transfer', () => {
  const loadFixture = setupFixtureLoader()

  it('does not allow transfer of LP tokens', async () => {
    const { portfolio, lender, lender2, token, depositIntoPortfolio, parseShares } = await loadFixture(managedPortfolioFixture)

    await token.mint(lender.address, parseUSDC(10))
    await depositIntoPortfolio(10, lender)
    await expect(portfolio.connect(lender).transfer(lender2.address, parseShares(5)))
      .to.be.revertedWith('ManagedPortfolio: transfer of LP tokens prohibited')
    expect(await portfolio.balanceOf(lender.address)).to.equal(parseShares(10))
  })
})
