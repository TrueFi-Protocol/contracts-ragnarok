import { PopulatedTransaction, Wallet } from 'ethers'
import readline from 'readline'

export async function sendTransactionAndWait (wallet: Wallet, description: string, transaction: PopulatedTransaction) {
  console.log()
  console.log(description)
  await waitForKeyPress()

  const tx = await wallet.sendTransaction(transaction)
  console.log(`Tx hash: ${tx.hash}`)
  console.log('Mining...')
  await tx.wait()
}

export async function waitForKeyPress () {
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
