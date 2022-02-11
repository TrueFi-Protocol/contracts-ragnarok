import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture } from '../fixtures'

describe('BulletLoans.initializer', () => {
  const loadFixture = setupFixtureLoader()

  it('sets borrowerSignatureVerifier correctly', async () => {
    const { bulletLoans, borrowerVerifier } = await loadFixture(bulletLoansFixture)
    expect(await bulletLoans.borrowerSignatureVerifier()).to.eq(borrowerVerifier.address)
  })
})
