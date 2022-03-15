import { Multicall2__factory } from '../../../build/types'
import { defaultAccounts } from 'ethereum-waffle'
import { Wallet } from 'ethers'
import { deploy } from './deploy'
import { saveAddressesToFile } from '../shared/saveAddressesToFile'
import { startGanache } from '../shared/startGanache'
import { deployUsdc } from '../shared/tasks/deployUsdc'
import { config } from './config'

async function run() {
  const provider = await startGanache()
  const owner = new Wallet(defaultAccounts[0].secretKey, provider)
  const protocol = new Wallet(defaultAccounts[1].secretKey, provider)
  const usdc = await deployUsdc(owner)
  const multicall = await new Multicall2__factory(owner).deploy()
  const ragnarokAddresses = await deploy(usdc, owner, protocol)
  saveAddressesToFile({
    Multicall: { address: multicall.address },
    MockUsdc: { address: usdc.address },
    ...ragnarokAddresses,
  }, config.deploymentsFile)
  console.log('\n' + 'DONE 🌟')
}

run()
