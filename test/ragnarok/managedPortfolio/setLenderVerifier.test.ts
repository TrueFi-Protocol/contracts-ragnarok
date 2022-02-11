import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { managedPortfolioFixture } from '../fixtures'
import { SignatureOnlyLenderVerifier__factory } from 'contracts'

describe('ManagedPortfolio.setLenderVerifier', () => {
  const loadFixture = setupFixtureLoader()

  it('only manager can set lender verifier', async () => {
    const { portfolio, lender, protocolOwner, DEPOSIT_MESSAGE } = await loadFixture(managedPortfolioFixture)
    const newLenderVerifier = await new SignatureOnlyLenderVerifier__factory(protocolOwner).deploy(DEPOSIT_MESSAGE)

    await expect(portfolio.connect(lender).setLenderVerifier(newLenderVerifier.address))
      .to.be.revertedWith('Manageable: Caller is not the manager')
  })

  it('sets new lender verifier', async () => {
    const { portfolio, manager, protocolOwner, DEPOSIT_MESSAGE } = await loadFixture(managedPortfolioFixture)
    const newLenderVerifier = await new SignatureOnlyLenderVerifier__factory(protocolOwner).deploy(DEPOSIT_MESSAGE)

    await portfolio.connect(manager).setLenderVerifier(newLenderVerifier.address)
    expect(await portfolio.lenderVerifier()).to.equal(newLenderVerifier.address)
  })

  it('emits a LenderVerifierChanged event', async () => {
    const { portfolio, manager, protocolOwner, DEPOSIT_MESSAGE } = await loadFixture(managedPortfolioFixture)
    const newLenderVerifier = await new SignatureOnlyLenderVerifier__factory(protocolOwner).deploy(DEPOSIT_MESSAGE)

    await expect(portfolio.connect(manager).setLenderVerifier(newLenderVerifier.address))
      .to.emit(portfolio, 'LenderVerifierChanged').withArgs(newLenderVerifier.address)
  })
})
