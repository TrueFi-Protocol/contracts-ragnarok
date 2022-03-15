import {
  DummyV1__factory,
  DummyV2__factory,
  DummyV3__factory,
  DummyV4__factory,
} from 'contracts'
import { Wallet } from 'ethers'
import { deployBehindProxy } from 'utils'

export async function proxyUpgradeFixture([manager, nonManager]: Wallet[]) {
  const proxy = await deployBehindProxy(new DummyV1__factory(manager))
  const v2Implementation = await new DummyV2__factory(manager).deploy()
  const v3Implementation = await new DummyV3__factory(manager).deploy()
  const v4Implementation = await new DummyV4__factory(manager).deploy()
  await proxy.setA(42)

  return { manager, nonManager, proxy, v2Implementation, v3Implementation, v4Implementation }
}
