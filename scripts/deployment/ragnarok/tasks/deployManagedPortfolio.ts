import { debug } from 'ethereum-mars'
import { ManagedPortfolioFactory } from '../../../../build/artifacts'
import { MarsContract } from '../../utils/marsContract'
import { config } from '../config'

export function deployManagedPortfolio(token: MarsContract, factory: MarsContract<typeof ManagedPortfolioFactory>, lenderVerifier: MarsContract) {
  const manager = factory.manager().map(manager => manager)
  factory.setIsWhitelisted(manager, true)
  factory.createPortfolio(config.managedPortfolio.name, config.managedPortfolio.symbol, token, lenderVerifier, config.managedPortfolio.duration, config.managedPortfolio.maxSize, config.managedPortfolio.managerFee)
  const portfolios = factory.getPortfolios()
  const lastPortfolio = portfolios.map(p => p[p.length - 1])
  debug('Deployed ManagedPortfolio', lastPortfolio)
  return lastPortfolio
}
