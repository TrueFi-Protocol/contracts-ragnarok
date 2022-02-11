import { Manageable__factory } from 'contracts'
import { Wallet } from 'ethers'

import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { AddressZero } from '@ethersproject/constants'

async function fixture ([manager, otherWallet]: Wallet[]) {
  const manageable = await new Manageable__factory(manager).deploy(manager.address)

  return { manageable, manager, otherWallet }
}

describe('Manageable', () => {
  const loadFixture = setupFixtureLoader()

  describe('Manageable.claimManagement', () => {
    it('reverts when called not by the pending manager', async () => {
      const { manageable, manager } = await loadFixture(fixture)

      await expect(manageable.connect(manager).claimManagement())
        .to.be.revertedWith('Manageable: Caller is not the pending manager')
    })

    it('sets new manager', async () => {
      const { manageable, manager, otherWallet } = await loadFixture(fixture)
      await manageable.connect(manager).transferManagement(otherWallet.address)

      await manageable.connect(otherWallet).claimManagement()
      expect(await manageable.manager()).to.equal(otherWallet.address)
    })

    it('sets pending manager to 0', async () => {
      const { manageable, manager, otherWallet } = await loadFixture(fixture)
      await manageable.connect(manager).transferManagement(otherWallet.address)

      await manageable.connect(otherWallet).claimManagement()
      expect(await manageable.pendingManager()).to.equal(AddressZero)
    })
  })

  describe('Manageable.constructor', () => {
    it('sets manager as creator', async () => {
      const { manageable, manager } = await loadFixture(fixture)
      expect(await manageable.manager()).to.equal(manager.address)
    })

    it('initially sets pendingManager to 0', async () => {
      const { manageable } = await loadFixture(fixture)
      expect(await manageable.pendingManager()).to.equal(AddressZero)
    })

    it('emits event', async () => {
      const { manager } = await loadFixture(fixture)
      const anotherManageable = await new Manageable__factory(manager).deploy(manager.address)

      const creationTx = (anotherManageable).deployTransaction
      await expect(creationTx)
        .to.emit(anotherManageable, 'ManagementTransferred')
        .withArgs(AddressZero, manager.address)
    })
  })

  describe('Manageable.transferManagement', () => {
    it('reverts when called not by the manager', async () => {
      const { manageable, otherWallet } = await loadFixture(fixture)

      await expect(manageable.connect(otherWallet).transferManagement(otherWallet.address))
        .to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('sets pendingManager', async () => {
      const { manageable, manager, otherWallet } = await loadFixture(fixture)

      await manageable.connect(manager).transferManagement(otherWallet.address)
      expect(await manageable.pendingManager()).to.equal(otherWallet.address)
    })
  })
})
