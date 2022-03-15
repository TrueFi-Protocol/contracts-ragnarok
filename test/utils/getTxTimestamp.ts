import { MockProvider } from 'ethereum-waffle'
import { ContractTransaction } from 'ethers'

export async function getTxTimestamp(tx: ContractTransaction, provider: MockProvider): Promise<number> {
  const txReceipt = await tx.wait()
  return (await provider.getBlock(txReceipt.blockHash)).timestamp
}
