import { contract } from 'ethereum-mars'
import { BulletLoans } from '../../../../build/artifacts'
import { BulletLoans__factory } from '../../../../build'
import { encodeInitializeCall } from '../../utils/encodeInitializeCall'
import { proxy } from '../../utils/proxy'
import { MarsContract } from '../../utils/marsContract'
import { Address } from 'ethereum-mars/build/src/symbols'

export function deployBulletLoans(borrowerSignatureVerifier: MarsContract) {
  const implementation = contract(BulletLoans)
  const initializeCalldata = borrowerSignatureVerifier[Address].map(verifier => encodeInitializeCall(BulletLoans__factory, verifier))
  return proxy(implementation, initializeCalldata)
}
