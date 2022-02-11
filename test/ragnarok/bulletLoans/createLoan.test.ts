import { expect } from 'chai'
import { setupFixtureLoader } from 'test/setup'
import { bulletLoansFixture, BulletLoanStatus as Status } from '../fixtures'
import { parseUSDC } from 'utils'
import { AddressZero } from '@ethersproject/constants'
import { YEAR } from 'utils/constants'

describe('BulletLoans.createLoan', () => {
  const loadFixture = setupFixtureLoader()

  it('assigns loanIds sequentially', async () => {
    const { createLoan } = await loadFixture(bulletLoansFixture)

    const loanId = await createLoan()
    expect(loanId).to.equal(0)
    const loanId2 = await createLoan()
    expect(loanId2).to.equal(1)
  })

  it('cannot have a zero duration', async () => {
    const { bulletLoans, portfolio, borrower, token } = await loadFixture(bulletLoansFixture)

    await expect(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), 0, borrower.address)).to.be.revertedWith('BulletLoans: Loan duration must be nonzero')
  })

  it('mints loan to the portfolio', async () => {
    const { bulletLoans, portfolio, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    expect(await bulletLoans.ownerOf(loanId)).to.eq(portfolio.address)
  })

  it('correctly initializes loan parameters', async () => {
    const { bulletLoans, borrower, token, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    const loanParameters = await bulletLoans.loans(loanId)
    expect(loanParameters.underlyingToken).to.equal(token.address)
    expect(loanParameters.status).to.equal(Status.Issued)
    expect(loanParameters.principal).to.equal(parseUSDC(5))
    expect(loanParameters.totalDebt).to.equal(parseUSDC(6))
    expect(loanParameters.amountRepaid).to.equal(parseUSDC(0))
    expect(loanParameters.duration).to.equal(YEAR)
    expect(loanParameters.recipient).to.equal(borrower.address)
  })

  it('correctly initializes loan repayment date', async () => {
    const { bulletLoans, borrower, token, extractLoanId, getTxTimestamp } = await loadFixture(bulletLoansFixture)

    const loanCreationTx = bulletLoans.connect(borrower).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address)
    const loanId = await extractLoanId(loanCreationTx)
    const loanCreationTimestamp = await getTxTimestamp(loanCreationTx)
    const loanParameters = await bulletLoans.loans(loanId)
    expect(loanParameters.repaymentDate).to.equal(loanCreationTimestamp + YEAR)
  })

  it('loanParameters for non-existent loan are set to 0', async () => {
    const { bulletLoans, createLoan } = await loadFixture(bulletLoansFixture)
    const loanId = await createLoan()

    const nextId = loanId.add(1)
    const loanParameters = await bulletLoans.loans(nextId)
    expect(loanParameters.underlyingToken).to.equal(AddressZero)
    expect(loanParameters.status).to.equal(Status.Issued)
    expect(loanParameters.principal).to.equal(parseUSDC(0))
    expect(loanParameters.totalDebt).to.equal(parseUSDC(0))
    expect(loanParameters.amountRepaid).to.equal(parseUSDC(0))
    expect(loanParameters.duration).to.equal(0)
    expect(loanParameters.repaymentDate).to.equal(0)
    expect(loanParameters.recipient).to.equal(AddressZero)
  })

  it('cannot create a loan with totalDebt less than principal', async () => {
    const { bulletLoans, portfolio, token, borrower } = await loadFixture(bulletLoansFixture)

    await expect(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(4), YEAR, borrower.address))
      .to.be.revertedWith('BulletLoans: Total debt cannot be less than principal')
  })

  it('emits event', async () => {
    const { bulletLoans, portfolio, borrower, token } = await loadFixture(bulletLoansFixture)

    await expect(bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address))
      .to.emit(bulletLoans, 'LoanCreated')
      .withArgs(0)
  })
})
