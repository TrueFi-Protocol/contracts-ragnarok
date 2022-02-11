import { waffle } from 'hardhat'
import {
  BulletLoans__factory,
  ProtocolConfig__factory,
  ManagedPortfolio__factory,
  ManagedPortfolioFactory__factory,
  MockUsdc__factory,
  SignatureOnlyLenderVerifier__factory,
} from 'contracts'
import { Wallet, ContractTransaction } from 'ethers'
import { deployBehindProxy, extractArgFromTx, parseUSDC } from 'utils'
import { MANAGED_PORTFOLIO_NAME, MANAGED_PORTFOLIO_SYMBOL, YEAR, ONE_PERCENT } from 'utils/constants'
import { AddressZero } from '@ethersproject/constants'

export async function managedPortfolioFactoryFixture ([protocolOwner, protocol, manager]: Wallet[]) {
  const DEPOSIT_MESSAGE = 'deposit message'

  const bulletLoans = await deployBehindProxy(new BulletLoans__factory(protocolOwner), AddressZero)
  const protocolConfig = await deployBehindProxy(new ProtocolConfig__factory(protocolOwner), 500, protocol.address)
  const portfolioImplementation = await new ManagedPortfolio__factory(protocolOwner).deploy()
  const factory = await deployBehindProxy(new ManagedPortfolioFactory__factory(protocolOwner), bulletLoans.address, protocolConfig.address, portfolioImplementation.address)
  const token = await new MockUsdc__factory(protocolOwner).deploy()
  const lenderVerifier = await new SignatureOnlyLenderVerifier__factory(protocolOwner).deploy(DEPOSIT_MESSAGE)

  const extractPortfolioAddress = (pendingTx: Promise<ContractTransaction>) =>
    extractArgFromTx(pendingTx, [factory.address, 'PortfolioCreated', 'newPortfolio'])

  async function extractCreationTimestamp (pendingTx: Promise<ContractTransaction>) {
    const tx = await pendingTx
    const receipt = await tx.wait()
    const creationTimestamp = (await waffle.provider.getBlock(receipt.blockHash)).timestamp
    return creationTimestamp
  }

  async function attemptCreatingPortfolio (sender: Wallet, underlyingToken = token.address) {
    return factory.connect(sender).createPortfolio(
      MANAGED_PORTFOLIO_NAME,
      MANAGED_PORTFOLIO_SYMBOL,
      underlyingToken,
      lenderVerifier.address,
      YEAR,
      parseUSDC(1e7),
      10 * ONE_PERCENT,
    )
  }

  async function createPortfolio (underlyingToken = token.address) {
    const tx = attemptCreatingPortfolio(manager, underlyingToken)
    const portfolioAddress = await extractPortfolioAddress(tx)
    const portfolio = new ManagedPortfolio__factory(manager).attach(portfolioAddress)
    return { portfolio, tx }
  }

  await factory.setIsWhitelisted(manager.address, true)

  return { factory, bulletLoans, protocolConfig, lenderVerifier, protocolOwner, protocol, manager, token, createPortfolio, attemptCreatingPortfolio, extractCreationTimestamp, DEPOSIT_MESSAGE }
}
