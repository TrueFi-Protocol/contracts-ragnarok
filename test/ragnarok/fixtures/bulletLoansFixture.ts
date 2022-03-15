import {
  BulletLoans__factory,
  BorrowerSignatureVerifier__factory,
  MockUsdc__factory,
} from 'contracts'
import { waffle } from 'hardhat'
import { ContractTransaction, Wallet, BigNumberish, BigNumber } from 'ethers'
import { deployBehindProxy, extractArgFromTx, parseUSDC, signNewLoanParameters } from 'utils'
import { YEAR } from 'utils/constants'
import { expect } from 'chai'

export enum BulletLoanStatus {
  Issued,
  FullyRepaid,
  Defaulted,
  Resolved,
}

export async function bulletLoansFixture ([owner, portfolio, borrower]: Wallet[]) {
  const borrowerVerifier = await new BorrowerSignatureVerifier__factory(owner).deploy()
  const bulletLoans = await deployBehindProxy(new BulletLoans__factory(owner), borrowerVerifier.address)
  const token = await new MockUsdc__factory(owner).deploy()
  await token.mint(borrower.address, parseUSDC(100))
  await token.connect(borrower).approve(bulletLoans.address, parseUSDC(1e10))

  function extractLoanId (pendingTx: Promise<ContractTransaction>): Promise<BigNumber> {
    return extractArgFromTx(pendingTx, [bulletLoans.address, 'LoanCreated', 'instrumentId'])
  }

  function createLoan () {
    const createLoanTx = bulletLoans.connect(portfolio).createLoan(token.address, parseUSDC(5), parseUSDC(6), YEAR, borrower.address)
    return extractLoanId(createLoanTx)
  }

  async function getTxTimestamp (pendingTx: Promise<ContractTransaction>): Promise<number> {
    const txReceipt = await (await pendingTx).wait()
    return (await waffle.provider.getBlock(txReceipt.blockHash)).timestamp
  }

  function signNewParameters (wallet: Wallet, instrumentId: BigNumberish, newTotalDebt: BigNumberish, newRepaymentDate: BigNumberish) {
    return signNewLoanParameters(wallet, borrowerVerifier.address, instrumentId, newTotalDebt, newRepaymentDate)
  }

  const updateLoanParameters = (wallet: Wallet) => bulletLoans.connect(wallet)['updateLoanParameters(uint256,uint256,uint256)']
  const updateLoanParametersWithSignature = (wallet: Wallet) => bulletLoans.connect(wallet)['updateLoanParameters(uint256,uint256,uint256,bytes)']

  const testParamsChange = async (totalDebtDiff: BigNumberish, repaymentDateDiff: BigNumberish, loanId: BigNumber) => {
    const loanParametersBefore = await bulletLoans.loans(loanId)
    const signature = await signNewParameters(borrower, loanId, loanParametersBefore.totalDebt.add(totalDebtDiff), loanParametersBefore.repaymentDate.add(repaymentDateDiff))
    await updateLoanParametersWithSignature(portfolio)(loanId, loanParametersBefore.totalDebt.add(totalDebtDiff), loanParametersBefore.repaymentDate.add(repaymentDateDiff), signature)
    const loanParametersAfter = await bulletLoans.loans(loanId)
    expect(loanParametersAfter.totalDebt).to.equal(loanParametersBefore.totalDebt.add(totalDebtDiff))
    expect(loanParametersAfter.repaymentDate).to.equal(loanParametersBefore.repaymentDate.add(repaymentDateDiff))
    expect(loanParametersAfter.duration).to.equal(loanParametersBefore.duration.add(repaymentDateDiff))
  }

  return { testParamsChange, bulletLoans, borrowerVerifier, owner, portfolio, borrower, token, extractLoanId, createLoan, getTxTimestamp, signNewParameters, updateLoanParameters, updateLoanParametersWithSignature }
}
