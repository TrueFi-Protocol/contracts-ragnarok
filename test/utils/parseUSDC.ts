import { BigNumberish } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'

export const parseUSDC = (amount: BigNumberish) => parseUnits(amount.toString(), 6)
