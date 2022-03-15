import { BulletLoans__factory, BorrowerSignatureVerifier } from '../../../../build/types'
import { Wallet } from 'ethers'
import { deployBehindProxy } from '../../shared/tasks/deployBehindProxy'

export function deployBulletLoans(wallet: Wallet, borrowerSignatureVerifier: BorrowerSignatureVerifier) {
  return deployBehindProxy(new BulletLoans__factory(wallet), borrowerSignatureVerifier.address)
}
