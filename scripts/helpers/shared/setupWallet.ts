import { Networkish } from '@ethersproject/providers'
import { providers, Wallet } from 'ethers'
import { INFURA_KEY } from './constants'

export function setupWallet(network: Networkish, privateKey: string) {
  return new Wallet(privateKey, new providers.InfuraProvider(network, INFURA_KEY))
}
