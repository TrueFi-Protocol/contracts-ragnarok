import { Options, deploy, contract, saveContract } from 'ethereum-mars'
import { JsonRpcProvider } from '@ethersproject/providers'
import { deployRagnarok } from '../../deployment/deployRagnarok'
import { MockUsdc, Multicall2 } from '../../../build/artifacts'
import { defaultAccounts } from 'ethereum-waffle'
import { Address } from 'ethereum-mars/build/src/symbols'

const getOptions = (privateKey: string, provider: JsonRpcProvider, deploymentsFile: string): Options => ({
  privateKey,
  network: provider,
  noConfirm: true,
  verify: false,
  disableCommandLineOptions: true,
  outputFile: deploymentsFile,
})

export function deployRagnarokPlayground(privateKey: string, provider: JsonRpcProvider, deploymentsFile: string) {
  const options = getOptions(privateKey, provider, deploymentsFile)
  return deploy(options, (deployer, executeOptions) => {
    deployRagnarok(deployer, executeOptions)
  })
}

export function deployHelperContracts(provider: JsonRpcProvider, deploymentsFile: string) {
  const { secretKey } = defaultAccounts[0]
  const options = getOptions(secretKey, provider, deploymentsFile)
  return deploy(options, () => {
    contract(MockUsdc)
    const multicall = contract(Multicall2)
    saveContract('multicall', multicall[Address])
  })
}
