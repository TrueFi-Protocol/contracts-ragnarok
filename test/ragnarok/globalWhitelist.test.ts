import { GlobalWhitelistLenderVerifier__factory } from 'build/types/factories/GlobalWhitelistLenderVerifier__factory'
import { Wallet } from 'ethers'
import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'

export async function fixture ([deployer, lender]: Wallet[]) {
  const globalWhitelist = await new GlobalWhitelistLenderVerifier__factory(deployer).deploy()
  return { globalWhitelist, deployer, lender }
}

describe('GlobalWhitelistLenderVerifier', () => {
  const loadFixture = setupFixtureLoader()

  describe('constructor', () => {
    it('sets manager', async () => {
      const { globalWhitelist, deployer } = await loadFixture(fixture)
      expect(await globalWhitelist.manager()).to.equal(deployer.address)
    })
  })

  describe('setWhitelistStatus', () => {
    it('only manager can change status', async () => {
      const { globalWhitelist, lender } = await loadFixture(fixture)
      await expect(globalWhitelist.connect(lender).setWhitelistStatus(lender.address, true))
        .to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('changes whitelist status', async () => {
      const { globalWhitelist, lender } = await loadFixture(fixture)
      expect(await globalWhitelist.isWhitelisted(lender.address)).to.be.false

      await globalWhitelist.setWhitelistStatus(lender.address, true)
      expect(await globalWhitelist.isWhitelisted(lender.address)).to.be.true

      await globalWhitelist.setWhitelistStatus(lender.address, false)
      expect(await globalWhitelist.isWhitelisted(lender.address)).to.be.false
    })

    it('emits event', async () => {
      const { globalWhitelist, lender } = await loadFixture(fixture)
      await expect(globalWhitelist.setWhitelistStatus(lender.address, true))
        .to.emit(globalWhitelist, 'WhitelistStatusChanged')
        .withArgs(lender.address, true)
    })
  })

  describe('isAllowed', () => {
    it('returns whitelist status', async () => {
      const { globalWhitelist, lender } = await loadFixture(fixture)
      expect(await globalWhitelist.isAllowed(lender.address, 0, '0x')).to.be.false
      await globalWhitelist.setWhitelistStatus(lender.address, true)
      expect(await globalWhitelist.isAllowed(lender.address, 0, '0x')).to.be.true
    })
  })

  describe('setWhitelistStatusForMany', () => {
    it('only manager can change status', async () => {
      const { other, globalWhitelist } = await loadFixture(fixture)
      await expect(globalWhitelist.connect(other).setWhitelistStatusForMany([], true)).to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('set multiple whitelisted', async () => {
      const { globalWhitelist } = await loadFixture(fixture)
      const addressesToWhitelist = [Wallet.createRandom().address, Wallet.createRandom().address, Wallet.createRandom().address]

      await globalWhitelist.setWhitelistStatusForMany(addressesToWhitelist, true)
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[0], 0, '0x')).to.be.true
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[1], 0, '0x')).to.be.true
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[2], 0, '0x')).to.be.true

      await globalWhitelist.setWhitelistStatusForMany(addressesToWhitelist, false)
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[0], 0, '0x')).to.be.false
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[1], 0, '0x')).to.be.false
      expect(await globalWhitelist.isAllowed(addressesToWhitelist[2], 0, '0x')).to.be.false
    })

    // skip intended as it takes ~20s to pass
    it.skip('set plenty of addresses whitelisted', async () => {
      const { globalWhitelist } = await loadFixture(fixture)
      const addressesToWhitelist = [...new Array(1000)].map(() => Wallet.createRandom().address)
      await globalWhitelist.setWhitelistStatusForMany(addressesToWhitelist, true)
      for (let i = 0; i < addressesToWhitelist.length; i++) {
        expect(await globalWhitelist.isAllowed(addressesToWhitelist[i], 0, '0x')).to.be.true
      }
    }).timeout(120_000)
  })
})
