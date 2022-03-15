import {
  ManagedPortfolio__factory,
  BulletLoans__factory,
  SignatureOnlyLenderVerifier__factory,
  MockUsdc__factory,
  ProtocolConfig__factory,
} from 'contracts'
import { waffle } from 'hardhat'
import { Wallet, constants, ContractTransaction } from 'ethers'
import {
  deployBehindProxy,
  parseUSDC,
  timeTravel as _timeTravel,
  signConfirmationMessage,
  parseEth,
  extractArgFromTx,
} from 'utils'
import {
  MANAGED_PORTFOLIO_NAME,
  MANAGED_PORTFOLIO_SYMBOL,
  ONE_PERCENT,
  YEAR,
} from 'utils/constants'
const { AddressZero } = constants

export enum ManagedPortfolioStatus {
  Open,
  Frozen,
  Closed,
}

export async function managedPortfolioFixture([manager, protocolOwner, protocol, lender, lender2, lender3, _lender, borrower]: Wallet[]) {
  const DEPOSIT_MESSAGE = 'deposit message'

  const token = await new MockUsdc__factory(manager).deploy()
  const bulletLoans = await deployBehindProxy(new BulletLoans__factory(protocolOwner), AddressZero)
  const protocolConfig = await deployBehindProxy(new ProtocolConfig__factory(protocolOwner), 25, protocol.address)
  const lenderVerifier = await new SignatureOnlyLenderVerifier__factory(protocolOwner).deploy(DEPOSIT_MESSAGE)
  const portfolio = await deployBehindProxy(new ManagedPortfolio__factory(manager),
    MANAGED_PORTFOLIO_NAME,
    MANAGED_PORTFOLIO_SYMBOL,
    manager.address,
    token.address,
    bulletLoans.address,
    protocolConfig.address,
    lenderVerifier.address,
    YEAR,
    parseUSDC(1e7),
    ONE_PERCENT,
  )

  await token.mint(_lender.address, parseUSDC(1_000_000))

  const depositIntoPortfolio = async (amount: number, wallet: Wallet = _lender) => {
    await token.connect(wallet).approve(portfolio.address, parseUSDC(amount))
    const signature = await signMessage(wallet, DEPOSIT_MESSAGE)
    return portfolio.connect(wallet).deposit(parseUSDC(amount), signature)
  }

  const parseShares = parseEth

  const timeTravel = (time: number) => _timeTravel(waffle.provider, time)

  const getTxTimestamp = async (tx: ContractTransaction): Promise<number> => {
    const txReceipt = await tx.wait()
    return (await waffle.provider.getBlock(txReceipt.blockHash)).timestamp
  }

  const signMessage = (wallet: Wallet, message: string) => signConfirmationMessage(wallet, lenderVerifier.address, message)

  const extractLoanId = (pendingTx: Promise<ContractTransaction>) =>
    extractArgFromTx(pendingTx, [portfolio.address, 'BulletLoanCreated', 'id'], [bulletLoans.address, 'Transfer', 'tokenId'])

  const repayLoan = async (loanId: number, amount: number, wallet: Wallet = _lender) => {
    await token.connect(wallet).approve(bulletLoans.address, parseUSDC(amount))
    await bulletLoans.connect(wallet).repay(loanId, parseUSDC(amount))
  }

  return {
    portfolio,
    bulletLoans,
    lenderVerifier,
    protocolConfig,
    token,
    MANAGED_PORTFOLIO_NAME,
    MANAGED_PORTFOLIO_SYMBOL,
    DEPOSIT_MESSAGE,
    manager,
    protocol,
    protocolOwner,
    lender,
    lender2,
    lender3,
    borrower,
    getTxTimestamp,
    timeTravel,
    signMessage,
    depositIntoPortfolio,
    parseShares,
    extractLoanId,
    repayLoan,
  }
}
