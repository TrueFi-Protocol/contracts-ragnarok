import type { ContractFactory } from 'ethers'
import { Erc1967Proxy__factory } from '../../../../build/types/factories/Erc1967Proxy__factory'

type UnpackPromise<T> = T extends Promise<infer U> ? U : T

export async function deployBehindProxy<T extends ContractFactory>(factory: T, ...args: Parameters<UnpackPromise<ReturnType<T['deploy']>>['initialize']>): Promise<ReturnType<T['deploy']>> {
  const impl = await factory.deploy({ gasLimit: 10_000_000 })
  const init = (await impl.populateTransaction.initialize(...args)).data
  const proxy = await new Erc1967Proxy__factory(impl.signer).deploy(impl.address, init)
  return factory.attach(proxy.address)
}
