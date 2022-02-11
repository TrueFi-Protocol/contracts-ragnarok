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
})
