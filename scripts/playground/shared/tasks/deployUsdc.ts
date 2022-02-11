import { MockUsdc__factory } from '../../../../build/types'
import { Wallet } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'

const TOTAL_SUPPLY = 1_000_000_000

export async function deployUsdc (wallet: Wallet) {
  const usdc = await new MockUsdc__factory(wallet).deploy()
  await usdc.mint(wallet.address, parseUnits(TOTAL_SUPPLY.toString(), await usdc.decimals()))
  return usdc
}
