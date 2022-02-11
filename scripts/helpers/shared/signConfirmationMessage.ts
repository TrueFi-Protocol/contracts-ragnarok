import { Wallet } from 'ethers'
import { waitForKeyPress } from './sendTransactionAndWait'

export const signConfirmationMessage = async (wallet: Wallet, address: string, message: string, chainId: number) => {
  console.log(`Do you want to sign message: ${message}?`)
  await waitForKeyPress()

  const domain = {
    name: 'TrueFi',
    version: '1.0',
    chainId,
    verifyingContract: address,
  }
  const types = {
    Agreement: [{ name: 'confirmation', type: 'string' }],
  }
  const value = {
    confirmation: message,
  }

  return wallet._signTypedData(domain, types, value)
}
