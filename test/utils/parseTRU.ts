import { BigNumberish } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'

export const parseTRU = (amount: BigNumberish) => parseUnits(amount.toString(), 8)
