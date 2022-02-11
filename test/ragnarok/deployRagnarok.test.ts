import { MockUsdc__factory } from 'build/types'
import { expect } from 'chai'
import { waffle } from 'hardhat'
import { deploy } from 'scripts/playground/ragnarok/deploy'

describe('deployRagnarok', () => {
  it('returns contract addresses', async () => {
    const provider = waffle.provider
    const [wallet] = provider.getWallets()
    const usdc = await new MockUsdc__factory(wallet).deploy()
    const addresses = await deploy(usdc, wallet, wallet)
    Object.keys(addresses).map(key => expect(addresses[key].address).to.be.properAddress)
  })
})
