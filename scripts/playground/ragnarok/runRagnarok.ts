import { defaultAccounts } from 'ethereum-waffle'
import { deployHelperContracts, deployRagnarokPlayground } from './deploy'
import { startGanache } from '../shared/startGanache'
import { config } from './config'
import { Web3Provider } from '@ethersproject/providers'

export async function runRagnarok(provider: Web3Provider, deploymentsFile: string) {
  const { secretKey } = defaultAccounts[0]
  await deployRagnarokPlayground(secretKey, provider, deploymentsFile)
  console.log('\n' + 'Ragnarok deployment DONE 🌟')
}

export async function runRagnarokOnly() {
  const provider = await startGanache()
  await deployHelperContracts(provider, config.deploymentsFile)
  await runRagnarok(provider, config.deploymentsFile)
}
