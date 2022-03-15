import { ProtocolConfig__factory } from '../../../../build/types'
import { Wallet } from 'ethers'
import { config } from '../config'
import { deployBehindProxy } from '../../shared/tasks/deployBehindProxy'

export function deployProtocolConfig (wallet: Wallet, protocol: Wallet) {
  return deployBehindProxy(new ProtocolConfig__factory(wallet), config.protocol.fee, protocol.address)
}
