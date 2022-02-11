import { ManagedPortfolio__factory } from '../../../build/types'
import { providers, Wallet, utils } from 'ethers'
import { INFURA_KEY } from '../shared/constants'
import { sendTransactionAndWait } from '../shared/sendTransactionAndWait'
import { CliArgs, getCliArgs } from './cli'

const LOAN_DURATION = 7 * 24 * 60 * 60
const PRINCIPAL_AMOUNT = utils.parseUnits('11', 6)
const REPAYMENT_AMOUNT = utils.parseUnits('11.2', 6)

async function run (cliArgs: CliArgs) {
  const { privateKey, network, portfolioAddress, borrowerAddress } = cliArgs
  const wallet = new Wallet(privateKey, new providers.InfuraProvider(network, INFURA_KEY))
  const portfolio = ManagedPortfolio__factory.connect(portfolioAddress, wallet)

  const managerAddress = await portfolio.manager()
  if (wallet.address !== managerAddress) {
    console.log(`Caller is not manager, caller: ${wallet.address}, manager: ${managerAddress} 🚨`)
    return
  }

  const loanIds = await portfolio.getOpenLoanIds()
  const transaction = await portfolio.populateTransaction.createBulletLoan(LOAN_DURATION, borrowerAddress, PRINCIPAL_AMOUNT, REPAYMENT_AMOUNT)
  const description = `Do you want to create a bullet loan on portfolio ${portfolioAddress} for borrower ${borrowerAddress}?`
  await sendTransactionAndWait(wallet, description, transaction)

  if ((await portfolio.getOpenLoanIds()).length - loanIds.length === 1) {
    console.log('Bullet loan created successfully ⭐️')
  } else {
    console.log('Failed to create bullet loan 🚨')
  }
}

run(getCliArgs())
