import {
  BulletLoans,
  ManagedPortfolioFactory__factory,
  ProtocolConfig,
  ManagedPortfolio__factory,
} from '../../../../build/types'
import { Wallet } from 'ethers'
import { deployBehindProxy } from '../../shared/tasks/deployBehindProxy'

export async function deployManagedPortfolioFactory (owner: Wallet, bulletLoans: BulletLoans, protocolConfig: ProtocolConfig) {
  const portfolio = await new ManagedPortfolio__factory(owner).deploy()
  return deployBehindProxy(new ManagedPortfolioFactory__factory(owner), bulletLoans.address, protocolConfig.address, portfolio.address)
}
