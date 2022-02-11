import { Manageable__factory } from '../../../../build/types'
import { Wallet } from 'ethers'

export async function deployManageable (owner: Wallet) {
  return new Manageable__factory(owner).deploy(owner.address)
}
