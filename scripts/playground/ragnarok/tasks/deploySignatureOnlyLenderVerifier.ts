import { SignatureOnlyLenderVerifier__factory } from '../../../../build/types'
import { Wallet } from 'ethers'
import { config } from '../config'

export function deploySignatureOnlyLenderVerifier (wallet: Wallet) {
  return new SignatureOnlyLenderVerifier__factory(wallet).deploy(config.managedPortfolio.depositMessage)
}
