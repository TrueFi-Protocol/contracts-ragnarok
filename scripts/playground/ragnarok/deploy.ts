import { Wallet } from 'ethers'
import {
  deployBulletLoans,
  deployProtocolConfig,
  deployManagedPortfolio,
  deployManageable,
  deployManagedPortfolioFactory,
  deploySignatureOnlyLenderVerifier,
  deployBorrowerSignatureVerifier,
} from './tasks'
import { MockUsdc } from '../../../build/types'

export async function deploy(usdc: MockUsdc, owner: Wallet, protocol: Wallet) {
  const borrowerSignatureVerifier = await deployBorrowerSignatureVerifier(owner)
  const bulletLoans = await deployBulletLoans(owner, borrowerSignatureVerifier)
  const protocolConfig = await deployProtocolConfig(owner, protocol)
  const manageable = await deployManageable(owner)
  const lenderVerifier = await deploySignatureOnlyLenderVerifier(owner)
  const managedPortfolio = await deployManagedPortfolio(owner, usdc, bulletLoans, protocolConfig, lenderVerifier)
  const managedPortfolioFactory = await deployManagedPortfolioFactory(owner, bulletLoans, protocolConfig)
  await managedPortfolioFactory.setIsWhitelisted(owner.address, true)

  const addresses = {
    borrowerSignatureVerifier: { address: borrowerSignatureVerifier.address },
    bulletLoans_proxy: { address: bulletLoans.address },
    protocolConfig: { address: protocolConfig.address },
    manageable: { address: manageable.address },
    signatureOnlyLenderVerifier: { address: lenderVerifier.address },
    managedPortfolio: { address: managedPortfolio.address },
    managedPortfolioFactory_proxy: { address: managedPortfolioFactory.address },
  }
  return addresses
}
