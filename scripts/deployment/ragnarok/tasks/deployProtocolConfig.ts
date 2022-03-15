import { contract } from 'ethereum-mars'
import { ProtocolConfig } from '../../../../build/artifacts'
import { ProtocolConfig__factory } from '../../../../build'
import { encodeInitializeCall } from '../../utils/encodeInitializeCall'
import { proxy } from '../../utils/proxy'
import { config } from '../config'

export function deployProtocolConfig() {
  const implementation = contract(ProtocolConfig)
  const initializeCalldata = encodeInitializeCall(ProtocolConfig__factory, config.protocol.fee, config.protocol.feeCollector)
  return proxy(implementation, initializeCalldata)
}
