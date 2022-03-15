import fetch from 'node-fetch'
import { PopulatedTransaction, Wallet, utils } from 'ethers'
import readline from 'readline'

export async function sendTransactionAndWait (wallet: Wallet, description: string, transaction: PopulatedTransaction) {
  console.log()
  await printTxStats(wallet, transaction, description)
  await waitForKeyPress()

  const tx = await wallet.sendTransaction(transaction)
  console.log(`Tx hash: ${tx.hash}`)
  console.log('Mining...')
  await tx.wait()
}

export function waitForKeyPress () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.write('--- Press ENTER to submit or Ctrl+C to exit ---')
  return new Promise<void>((resolve) => {
    rl.on('line', () => {
      process.stdout.moveCursor(0, -1)
      process.stdout.clearLine(1)
      resolve()
      rl.close()
    })
  })
}

async function printTxStats (wallet: Wallet, transaction: PopulatedTransaction, description: string) {
  const gasLimit = await wallet.estimateGas(transaction)
  const gasPrice = await wallet.getGasPrice()
  const ethPrice = await getEthPriceUsd()

  const fee = utils.formatEther(gasPrice.mul(gasLimit))
  const feeInUsd = (parseFloat(fee) * ethPrice).toFixed(2)
  const balance = utils.formatEther(await wallet.getBalance())
  const balanceInUsd = (parseFloat(balance) * ethPrice).toFixed(2)

  console.log(description)
  console.log(`Estimated fee: $${feeInUsd}, Ξ${fee}`)
  console.log(`Balance: $${balanceInUsd}, Ξ${balance}`)
}

async function getEthPriceUsd (): Promise<number> {
  try {
    const res = await fetch('https://api.coinpaprika.com/v1/tickers/eth-ethereum')
    const data = await res.json()
    return data.quotes.USD.price
  } catch {
    return 0
  }
}
