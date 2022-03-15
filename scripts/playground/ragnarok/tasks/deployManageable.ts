import { Manageable__factory } from '../../../../build/types'
import { Wallet } from 'ethers'

export function deployManageable(owner: Wallet) {
  return new Manageable__factory(owner).deploy(owner.address)
}
