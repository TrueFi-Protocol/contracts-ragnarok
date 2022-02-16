import { Whitelist__factory } from 'contracts'
import { Wallet } from 'ethers'
import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'

export async function fixture ([deployer, lender]: Wallet[]) {
  const whitelist = await new Whitelist__factory(deployer).deploy()
  return { whitelist, deployer, lender }
}

describe('Whitelist', () => {
  const loadFixture = setupFixtureLoader()

  describe('constructor', () => {
    it('sets manager', async () => {
      const { whitelist, deployer } = await loadFixture(fixture)
      expect(await whitelist.manager()).to.equal(deployer.address)
    })
  })

  describe('setWhitelistStatus', () => {
    it('only manager can change status', async () => {
      const { whitelist, lender } = await loadFixture(fixture)
      await expect(whitelist.connect(lender).setWhitelistStatus(lender.address, true))
        .to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('changes whitelist status', async () => {
      const { whitelist, lender } = await loadFixture(fixture)
      expect(await whitelist.isWhitelisted(lender.address)).to.be.false

      await whitelist.setWhitelistStatus(lender.address, true)
      expect(await whitelist.isWhitelisted(lender.address)).to.be.true

      await whitelist.setWhitelistStatus(lender.address, false)
      expect(await whitelist.isWhitelisted(lender.address)).to.be.false
    })

    it('emits event', async () => {
      const { whitelist, lender } = await loadFixture(fixture)
      await expect(whitelist.setWhitelistStatus(lender.address, true))
        .to.emit(whitelist, 'WhitelistStatusChanged')
        .withArgs(lender.address, true)
    })
  })

  describe('isAllowed', () => {
    it('returns whitelist status', async () => {
      const { whitelist, lender } = await loadFixture(fixture)
      expect(await whitelist.isAllowed(lender.address, 0, '0x')).to.be.false
      await whitelist.setWhitelistStatus(lender.address, true)
      expect(await whitelist.isAllowed(lender.address, 0, '0x')).to.be.true
    })
  })

  describe('setWhitelistStatusForMany', () => {
    it('only manager can change status', async () => {
      const { other, whitelist } = await loadFixture(fixture)
      await expect(whitelist.connect(other).setWhitelistStatusForMany([], true)).to.be.revertedWith('Manageable: Caller is not the manager')
    })

    it('set multiple whitelisted', async () => {
      const { whitelist } = await loadFixture(fixture)
      const addressesToWhitelist = [Wallet.createRandom().address, Wallet.createRandom().address, Wallet.createRandom().address]

      await whitelist.setWhitelistStatusForMany(addressesToWhitelist, true)
      expect(await whitelist.isAllowed(addressesToWhitelist[0], 0, '0x')).to.be.true
      expect(await whitelist.isAllowed(addressesToWhitelist[1], 0, '0x')).to.be.true
      expect(await whitelist.isAllowed(addressesToWhitelist[2], 0, '0x')).to.be.true

      await whitelist.setWhitelistStatusForMany(addressesToWhitelist, false)
      expect(await whitelist.isAllowed(addressesToWhitelist[0], 0, '0x')).to.be.false
      expect(await whitelist.isAllowed(addressesToWhitelist[1], 0, '0x')).to.be.false
      expect(await whitelist.isAllowed(addressesToWhitelist[2], 0, '0x')).to.be.false
    })

    // skip intended as it takes ~20s to pass
    it.skip('set plenty of addresses whitelisted', async () => {
      const { whitelist } = await loadFixture(fixture)
      const addressesToWhitelist = [...new Array(1000)].map(() => Wallet.createRandom().address)
      await whitelist.setWhitelistStatusForMany(addressesToWhitelist, true)
      for (let i = 0; i < addressesToWhitelist.length; i++) {
        expect(await whitelist.isAllowed(addressesToWhitelist[i], 0, '0x')).to.be.true
      }
    }).timeout(120_000)
  })
})
