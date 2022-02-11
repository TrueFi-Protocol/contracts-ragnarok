import { BorrowerSignatureVerifier__factory } from '../../../../build/types'
import { Wallet } from 'ethers'

export async function deployBorrowerSignatureVerifier (wallet: Wallet) {
  return new BorrowerSignatureVerifier__factory(wallet).deploy()
}
