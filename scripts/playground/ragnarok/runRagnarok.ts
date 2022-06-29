import { MockUsdc__factory, Multicall2__factory } from '../../../build/types'
import { defaultAccounts } from 'ethereum-waffle'
import { Wallet } from 'ethers'
import { deploy } from './deploy'
import { saveAddressesToFile } from '../shared/saveAddressesToFile'
import { startGanache } from '../shared/startGanache'
import { deployUsdc } from '../shared/tasks/deployUsdc'
import { config } from './config'
import { Web3Provider } from '@ethersproject/providers'
import { readContractAddress } from '../../utils'

export async function runRagnarok(overrideProvider?: Web3Provider, deploymentsFile?: string) {
  const provider = overrideProvider ?? await startGanache()
  const owner = new Wallet(defaultAccounts[0].secretKey, provider)
  const protocol = new Wallet(defaultAccounts[1].secretKey, provider)
  const usdc = await getUsdc(owner, deploymentsFile)
  const multicall = await getMulticall(owner, deploymentsFile)
  const ragnarokAddresses = await deploy(usdc, owner, protocol)
  saveAddressesToFile({
    multicall: { address: multicall.address },
    mockUsdc: { address: usdc.address },
    ...ragnarokAddresses,
  }, deploymentsFile ?? config.deploymentsFile)
  console.log('\n' + 'Ragnarok deployment DONE 🌟')
}

async function getUsdc(owner: Wallet, deploymentsFile?: string) {
  if (!deploymentsFile) {
    return deployUsdc(owner)
  }
  const { name } = await owner.provider.getNetwork()
  const usdcAddress = readContractAddress(deploymentsFile, name, 'mockUsdc')
  return new MockUsdc__factory(owner).attach(usdcAddress)
}

async function getMulticall(owner: Wallet, deploymentsFile?: string) {
  if (!deploymentsFile) {
    return new Multicall2__factory(owner).deploy()
  }
  const { name } = await owner.provider.getNetwork()
  const multicallAddress = readContractAddress(deploymentsFile, name, 'multicall2')
  return new Multicall2__factory(owner).attach(multicallAddress)
}
