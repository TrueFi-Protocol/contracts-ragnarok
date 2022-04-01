import { setupFixtureLoader } from '../setup'
import { expect } from 'chai'
import { Wallet } from 'ethers'
import { TwoWhitelistsVerifier__factory } from 'contracts/factories/TwoWhitelistsVerifier__factory'
import { GlobalWhitelistLenderVerifier__factory } from 'contracts/factories/GlobalWhitelistLenderVerifier__factory'
import { DsRegistryService__factory } from 'contracts/factories/DsRegistryService__factory'

export async function fixture([deployer, lender]: Wallet[]) {
  const registryService = await new DsRegistryService__factory(deployer).deploy()
  const globalWhitelistService = await new GlobalWhitelistLenderVerifier__factory(deployer).deploy()
  const lenderVerifier = await new TwoWhitelistsVerifier__factory(deployer).deploy(registryService.address, globalWhitelistService.address)

  return { lenderVerifier, deployer, lender, globalWhitelistService, registryService }
}

describe('TwoWhitelistsVerifier', () => {
  const loadFixture = setupFixtureLoader()

  describe('isAllowed', () => {
    it('returns false if address is not present on any whitelist', async () => {
      const { lenderVerifier, lender } = await loadFixture(fixture)

      expect(await lenderVerifier.isAllowed(lender.address, 0, '0x')).to.be.false
    })

    it('returns true if address is on global whitelist service', async () => {
      const { globalWhitelistService, lenderVerifier, lender } = await loadFixture(fixture)
      await globalWhitelistService.setWhitelistStatus(lender.address, true)

      expect(await lenderVerifier.isAllowed(lender.address, 0, '0x')).to.be.true
    })

    it('returns true if address is on transfer agent whitelist service', async () => {
      const { registryService, lenderVerifier, lender } = await loadFixture(fixture)
      await registryService.setWhitelistStatus(lender.address, true)

      expect(await lenderVerifier.isAllowed(lender.address, 0, '0x')).to.be.true
    })
  })
})
