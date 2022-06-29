import { expect } from 'chai'
import { defaultAccounts } from 'ethereum-waffle'
import { providers } from 'ethers'
import { existsSync, unlinkSync } from 'fs'
import ganache from 'ganache'
import { deployHelperContracts } from 'scripts/playground/ragnarok/deploy'
import { runRagnarok } from 'scripts/playground/ragnarok/runRagnarok'
import { safeReadJsonFile } from './utils'

describe('deployRagnarok', () => {
  const originalLog = console.log

  before(() => {
    console.log = () => undefined
  })

  after(() => {
    console.log = originalLog
  })

  async function createProvider() {
    const ganacheProvider = ganache.provider({
      accounts: defaultAccounts,
      gasLimit: 15_000_000,
      logging: {
        quiet: true,
      },
    })

    const provider = new providers.Web3Provider(ganacheProvider as unknown as providers.ExternalProvider)
    const network = await provider.getNetwork()
    network.name = 'ganache'

    return provider
  }

  it('generates deployments file as in repo', async () => {
    const expected = safeReadJsonFile('deployments.json').ganache
    const deploymentsTestFile = 'deployments-test.json'
    if (existsSync(deploymentsTestFile)) {
      unlinkSync(deploymentsTestFile)
    }

    const provider = await createProvider()
    await deployHelperContracts(provider, deploymentsTestFile)
    await runRagnarok(provider, deploymentsTestFile)

    const originalDeployments = safeReadJsonFile(deploymentsTestFile).ganache
    for (const contractName in originalDeployments) {
      expect(originalDeployments[contractName].address).to.eq(expected[contractName].address)
    }
  })
})
