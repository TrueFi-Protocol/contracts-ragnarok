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
import { MockUsdc } from 'build/types'

export async function deploy(usdc: MockUsdc, owner: Wallet, protocol: Wallet) {
  const borrowerSignatureVerifier = await deployBorrowerSignatureVerifier(owner)
  const bulletLoans = await deployBulletLoans(owner, borrowerSignatureVerifier)
  const protocolConfig = await deployProtocolConfig(owner, protocol)
  const manageable = await deployManageable(owner)
  const lenderVerifier = await deploySignatureOnlyLenderVerifier(owner)
  const managedPortfolio = await deployManagedPortfolio(owner, usdc, bulletLoans, protocolConfig, lenderVerifier)
  const managedPortfolioFactory = await deployManagedPortfolioFactory(owner, bulletLoans, protocolConfig)

  const addresses = {
    BorrowerSignatureVerifier: { address: borrowerSignatureVerifier.address },
    BulletLoans: { address: bulletLoans.address },
    ProtocolConfig: { address: protocolConfig.address },
    Manageable: { address: manageable.address },
    SignatureOnlyLenderVerifier: { address: lenderVerifier.address },
    ManagedPortfolio: { address: managedPortfolio.address },
    ManagedPortfolioFactory: { address: managedPortfolioFactory.address },
  }
  return addresses
}
