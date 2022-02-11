import { ContractFactory, Signer } from 'ethers'
import { constants } from 'ethers'

type Class<T> = T extends {attach(address: string): infer R} ? ((new (...args: any[]) => T) & {connect(address: string, wallet: Signer): R}) : never

export const encodeInitializeCall =
  <T extends Class<ContractFactory>>(factory: T, ...args: Parameters<ReturnType<T['connect']>['initialize']>) =>
    factory.connect(constants.AddressZero, null).interface.encodeFunctionData('initialize', args)
