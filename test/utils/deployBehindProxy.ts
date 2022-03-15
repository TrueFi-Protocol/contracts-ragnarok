import type { ContractFactory } from 'ethers'
import { Erc1967Proxy__factory } from 'contracts'
import { defineReadOnly } from 'ethers/lib/utils'

type UnpackPromise<T> = T extends Promise<infer U> ? U : T

export async function deployBehindProxy<T extends ContractFactory>(factory: T, ...args: Parameters<UnpackPromise<ReturnType<T['deploy']>>['initialize']>): Promise<ReturnType<T['deploy']>> {
  const impl = await factory.deploy()
  const init = (await impl.populateTransaction.initialize(...args)).data
  const proxy = await new Erc1967Proxy__factory(impl.signer).deploy(impl.address, init)
  const instance = factory.attach(proxy.address)
  defineReadOnly(instance, 'deployTransaction', proxy.deployTransaction)
  return instance
}
