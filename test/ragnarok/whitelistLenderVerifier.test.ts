import {
  ManagedPortfolio__factory,
  MockUsdc__factory,
  WhitelistLenderVerifier__factory,
} from 'contracts'
import { Wallet } from 'ethers'
import { deployBehindProxy, parseUSDC } from 'utils'
import { MANAGED_PORTFOLIO_NAME, MANAGED_PORTFOLIO_SYMBOL, ONE_PERCENT, YEAR } from 'utils/constants'
import { AddressZero } from '@ethersproject/constants'
import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'

async function fixture ([lender, manager, deployer]: Wallet[]) {
  const lenderVerifier = await new WhitelistLenderVerifier__factory(deployer).deploy()
  const token = await new MockUsdc__factory(manager).deploy()
  const portfolio = await deployBehindProxy(new ManagedPortfolio__factory(manager),
    MANAGED_PORTFOLIO_NAME,
    MANAGED_PORTFOLIO_SYMBOL,
    manager.address,
    token.address,
    AddressZero,
    AddressZero,
    lenderVerifier.address,
    YEAR,
    parseUSDC(1e7),
    ONE_PERCENT,
  )

  return { lenderVerifier, portfolio, token, lender, manager, deployer }
}

describe('WhitelistLenderVerifier', () => {
  const loadFixture = setupFixtureLoader()

  describe('setLenderWhitelistStatus', () => {
    it('allows only portfolio manager to modify whitelist', async () => {
      const { lenderVerifier, portfolio, lender, manager } = await loadFixture(fixture)

      await expect(lenderVerifier.connect(lender).setLenderWhitelistStatus(portfolio.address, lender.address, true))
        .to.be.revertedWith('WhitelistLenderVerifier: Only portfolio manager can modify whitelist')

      await expect(lenderVerifier.connect(manager).setLenderWhitelistStatus(portfolio.address, lender.address, true))
        .not.to.be.reverted
    })

    it('changes whitelist status', async () => {
      const { lenderVerifier, portfolio, lender, manager } = await loadFixture(fixture)

      await lenderVerifier.connect(manager).setLenderWhitelistStatus(portfolio.address, lender.address, true)
      expect(await lenderVerifier.isWhitelisted(portfolio.address, lender.address)).to.equal(true)

      await lenderVerifier.connect(manager).setLenderWhitelistStatus(portfolio.address, lender.address, false)
      expect(await lenderVerifier.isWhitelisted(portfolio.address, lender.address)).to.equal(false)
    })
  })

  describe('isAllowed', () => {
    it('disallows deposit for non-whitelisted lender', async () => {
      const { portfolio, lender } = await loadFixture(fixture)

      await expect(portfolio.connect(lender).deposit(parseUSDC(100), '0x'))
        .to.be.revertedWith('ManagedPortfolio: Lender is not allowed to deposit')
    })

    it('allows deposit for whitelisted lender', async () => {
      const { lenderVerifier, portfolio, token, lender, manager } = await loadFixture(fixture)

      await lenderVerifier.connect(manager).setLenderWhitelistStatus(portfolio.address, lender.address, true)
      await token.mint(lender.address, parseUSDC(100))
      await token.connect(lender).approve(portfolio.address, parseUSDC(100))

      await expect(portfolio.connect(lender).deposit(parseUSDC(100), '0x'))
        .not.to.be.reverted
    })

    it('does not affect other portfolio whitelists', async () => {
      const { lenderVerifier, portfolio, token, lender, manager } = await loadFixture(fixture)

      const otherPortfolio = await deployBehindProxy(new ManagedPortfolio__factory(manager),
        MANAGED_PORTFOLIO_NAME,
        MANAGED_PORTFOLIO_SYMBOL,
        manager.address,
        token.address,
        AddressZero,
        AddressZero,
        lenderVerifier.address,
        YEAR,
        parseUSDC(1e7),
        ONE_PERCENT,
      )
      await lenderVerifier.connect(manager).setLenderWhitelistStatus(portfolio.address, lender.address, true)
      await expect(otherPortfolio.connect(lender).deposit(parseUSDC(100), '0x'))
        .to.be.revertedWith('ManagedPortfolio: Lender is not allowed to deposit')
    })
  })
})
