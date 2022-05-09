import { MarsContract } from './marsContract'
import { createProxy, MaybeFuture } from 'ethereum-mars'
import { ProxyWrapper } from '../../../build/artifacts'
import { makeContractInstance } from 'ethereum-mars/build/src/syntax/contract'
import { Address, ArtifactSymbol, Name } from 'ethereum-mars/build/src/symbols'

export const proxy = <T extends MarsContract>(implementation: T, initializeCalldata: MaybeFuture<string>): T =>
  createProxy(ProxyWrapper, [implementation, initializeCalldata], (proxy) => (makeContractInstance(
    implementation[Name],
    implementation[ArtifactSymbol] as any,
    proxy[Address] as any,
  ) as any).upgradeTo(implementation))(implementation) as T
