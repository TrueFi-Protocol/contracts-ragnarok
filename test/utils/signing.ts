import { Wallet, BigNumberish } from 'ethers'

export const signConfirmationMessage = async (wallet: Wallet, address: string, message: string) => {
  const domain = {
    name: 'TrueFi',
    version: '1.0',
    chainId: 31337,
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

export const signNewLoanParameters = async (wallet: Wallet, address: string, instrumentId: BigNumberish, newTotalDebt: BigNumberish, newRepaymentDate: BigNumberish) => {
  const domain = {
    name: 'TrueFi',
    version: '1.0',
    chainId: 31337,
    verifyingContract: address,
  }
  const types = {
    NewLoanParameters: [
      { name: 'instrumentId', type: 'uint256' },
      { name: 'newTotalDebt', type: 'uint256' },
      { name: 'newRepaymentDate', type: 'uint256' },
    ],
  }
  const value = {
    instrumentId: instrumentId,
    newTotalDebt: newTotalDebt,
    newRepaymentDate: newRepaymentDate,
  }
  return wallet._signTypedData(domain, types, value)
}
