import { SignatureOnlyLenderVerifier__factory, Erc1271Verifier__factory } from 'contracts'
import { expect } from 'chai'
import { Wallet } from 'ethers'
import { signConfirmationMessage } from 'utils'
import { MAGIC_VALUE } from 'utils/constants'
import { setupFixtureLoader } from 'test/setup'

async function fixture([lender, deployer]: Wallet[]) {
  const DEPOSIT_MESSAGE = 'very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message 00 very long deposit message'
  const lenderVerifier = await new SignatureOnlyLenderVerifier__factory(deployer).deploy(DEPOSIT_MESSAGE)
  const erc1271verifier = await new Erc1271Verifier__factory(deployer).deploy()
  const digest = await lenderVerifier.digest()

  return { lenderVerifier, erc1271verifier, lender, deployer, digest, DEPOSIT_MESSAGE }
}

describe('SignatureOnlyLenderVerifier', () => {
  const loadFixture = setupFixtureLoader()

  describe('constructor', () => {
    it('sets depositMessage', async () => {
      const { lenderVerifier, DEPOSIT_MESSAGE } = await loadFixture(fixture)
      expect(await lenderVerifier.depositMessage()).to.equal(DEPOSIT_MESSAGE)
    })
  })

  describe('isAllowed', () => {
    describe('uses EIP-712 for EOA', () => {
      it('returns true for valid signature', async () => {
        const { lenderVerifier, lender, DEPOSIT_MESSAGE } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(lender, lenderVerifier.address, DEPOSIT_MESSAGE)
        expect(await lenderVerifier.isAllowed(lender.address, 0, signature)).to.be.true
      })

      it('returns false for invalid message', async () => {
        const { lenderVerifier, lender } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(lender, lenderVerifier.address, 'other message')
        expect(await lenderVerifier.isAllowed(lender.address, 0, signature)).to.be.false
      })

      it('returns false for invalid signer', async () => {
        const { lenderVerifier, lender, deployer, DEPOSIT_MESSAGE } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(deployer, lenderVerifier.address, DEPOSIT_MESSAGE)
        expect(await lenderVerifier.isAllowed(lender.address, 0, signature)).to.be.false
      })
    })

    describe('uses EIP-1271 for contracts', () => {
      it('returns true for valid signature', async () => {
        const { lenderVerifier, erc1271verifier, deployer, digest, DEPOSIT_MESSAGE } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(deployer, lenderVerifier.address, DEPOSIT_MESSAGE)
        expect(await erc1271verifier.isValidSignature(digest, signature)).to.equal(MAGIC_VALUE)
        expect(await lenderVerifier.isAllowed(erc1271verifier.address, 0, signature)).to.be.true
      })

      it('returns false for invalid signature', async () => {
        const { lenderVerifier, erc1271verifier, deployer, digest } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(deployer, lenderVerifier.address, 'other message')
        expect(await erc1271verifier.isValidSignature(digest, signature)).to.not.equal(MAGIC_VALUE)
        expect(await lenderVerifier.isAllowed(erc1271verifier.address, 0, signature)).to.be.false
      })

      it('returns false for invalid signer', async () => {
        const { lenderVerifier, erc1271verifier, lender, digest, DEPOSIT_MESSAGE } = await loadFixture(fixture)
        const signature = await signConfirmationMessage(lender, lenderVerifier.address, DEPOSIT_MESSAGE)
        expect(await erc1271verifier.isValidSignature(digest, signature)).to.not.equal(MAGIC_VALUE)
        expect(await lenderVerifier.isAllowed(erc1271verifier.address, 0, signature)).to.be.false
      })
    })
  })
})
