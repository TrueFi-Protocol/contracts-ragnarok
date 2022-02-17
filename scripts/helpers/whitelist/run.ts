import { ManagedPortfolioFactory__factory } from '../../../build/types'
import { CliArgs, getCliArgs } from './cli'
import { sendTransactionAndWait } from '../shared/sendTransactionAndWait'
import { setupWallet } from '../shared/setupWallet'

async function run (cliArgs: CliArgs) {
  const { privateKey, network, factoryAddress, addressToWhitelist } = cliArgs
  const wallet = setupWallet(network, privateKey)
  const portfolioFactory = ManagedPortfolioFactory__factory.connect(factoryAddress, wallet)

  const transaction = await portfolioFactory.populateTransaction.setIsWhitelisted(addressToWhitelist, true)
  const description = `Do you want to whitelist ${addressToWhitelist} in portfolio factory?`
  await sendTransactionAndWait(wallet, description, transaction)

  const isWhitelisted = await portfolioFactory.isWhitelisted(addressToWhitelist)
  console.log(`${addressToWhitelist} is ${!isWhitelisted ? 'not ' : ''}whitelisted now in portfolio factory`)
  console.log('DONE ⭐️')
}

run(getCliArgs())
