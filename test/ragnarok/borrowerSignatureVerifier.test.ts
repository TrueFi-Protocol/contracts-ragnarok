
import { BorrowerSignatureVerifier__factory, Erc1271Verifier__factory } from 'contracts'
import { Wallet } from 'ethers'

import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { signNewLoanParameters, MAGIC_VALUE } from 'utils'

export async function borrowerSignatureVerifierFixture([borrower, deployer]: Wallet[]) {
  const borrowerVerifier = await new BorrowerSignatureVerifier__factory(deployer).deploy()
  const erc1271verifier = await new Erc1271Verifier__factory(deployer).deploy()

  return { borrowerVerifier, erc1271verifier, borrower, deployer }
}

describe('BorrowerSignatureVerifier.verify', () => {
  const loadFixture = setupFixtureLoader()

  describe('uses EIP-712 for EOA', () => {
    it('returns true for valid signature', async () => {
      const { borrowerVerifier, borrower } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(borrower, borrowerVerifier.address, 1, 1, 1)
      expect(await borrowerVerifier.verify(borrower.address, 1, 1, 1, signature)).to.be.true
    })

    it('returns false for invalid parameters', async () => {
      const { borrowerVerifier, borrower } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(borrower, borrowerVerifier.address, 1, 0, 1)
      expect(await borrowerVerifier.verify(borrower.address, 1, 1, 1, signature)).to.be.false
    })

    it('returns false for invalid signer', async () => {
      const { borrowerVerifier, borrower, deployer } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(deployer, borrowerVerifier.address, 1, 1, 1)
      expect(await borrowerVerifier.verify(borrower.address, 1, 1, 1, signature)).to.be.false
    })
  })

  describe('uses EIP-1271 for contracts', () => {
    it('returns magic value for valid signature', async () => {
      const { borrowerVerifier, erc1271verifier, deployer } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(deployer, borrowerVerifier.address, 1, 1, 1)
      const hashed = await borrowerVerifier.hashTypedData(1, 1, 1)
      expect(await erc1271verifier.isValidSignature(hashed, signature)).to.be.equal(MAGIC_VALUE)
    })

    it('does not return magic value for invalid signature', async () => {
      const { borrowerVerifier, erc1271verifier, deployer } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(deployer, borrowerVerifier.address, 1, 0, 1)
      const hashed = await borrowerVerifier.hashTypedData(1, 1, 1)
      expect(await erc1271verifier.isValidSignature(hashed, signature)).not.to.be.equal(MAGIC_VALUE)
    })

    it('does not return magic value for invalid signer', async () => {
      const { borrowerVerifier, erc1271verifier, borrower } = await loadFixture(borrowerSignatureVerifierFixture)

      const signature = await signNewLoanParameters(borrower, borrowerVerifier.address, 1, 1, 1)
      const hashed = await borrowerVerifier.hashTypedData(1, 1, 1)
      expect(await erc1271verifier.isValidSignature(hashed, signature)).not.to.be.equal(MAGIC_VALUE)
    })
  })
})
