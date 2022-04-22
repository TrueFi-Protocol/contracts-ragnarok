import { BulletLoans, ERC20, ManagedPortfolio__factory, ProtocolConfig, SignatureOnlyLenderVerifier } from '../../../../build/types'
import { Wallet } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { config } from '../config'
import { deployBehindProxy } from '../../shared/tasks/deployBehindProxy'

export async function deployManagedPortfolio(owner: Wallet, token: ERC20, bulletLoans: BulletLoans, protocolConfig: ProtocolConfig, lenderVerifier: SignatureOnlyLenderVerifier) {
  return deployBehindProxy(new ManagedPortfolio__factory(owner),
    'ManagedPortfolio',
    'MPS',
    owner.address,
    token.address,
    bulletLoans.address,
    protocolConfig.address,
    lenderVerifier.address,
    config.managedPortfolio.duration,
    parseUnits(config.managedPortfolio.maxSize.toString(), await token.decimals()),
    config.managedPortfolio.managerFee,
  )
}
