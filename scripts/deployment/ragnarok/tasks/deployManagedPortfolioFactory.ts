import { contract, reduce } from 'ethereum-mars'
import { Address } from 'ethereum-mars/build/src/symbols'
import { ManagedPortfolioFactory, ProtocolConfig, BulletLoans, ManagedPortfolio } from '../../../../build/artifacts'
import { encodeInitializeCall } from '../../utils/encodeInitializeCall'
import { ManagedPortfolioFactory__factory } from '../../../../build'
import { MarsContract } from '../../utils/marsContract'
import { proxy } from '../../utils/proxy'

export function deployManagedPortfolioFactory(bulletLoans: MarsContract<typeof BulletLoans>, protocolConfig: MarsContract<typeof ProtocolConfig>, managedPortfolio: MarsContract<typeof ManagedPortfolio>) {
  const implementation = contract(ManagedPortfolioFactory)
  const initializeCalldata = reduce([bulletLoans[Address], protocolConfig[Address], managedPortfolio[Address]], (bulletLoans, protocolConfig, managedPortfolio) =>
    encodeInitializeCall(ManagedPortfolioFactory__factory, bulletLoans, protocolConfig, managedPortfolio),
  )
  return proxy(implementation, initializeCalldata)
}
