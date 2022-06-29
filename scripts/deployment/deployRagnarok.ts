import { contract, ExecuteOptions, Future, saveContract } from 'ethereum-mars'
import { makeContractInstance } from 'ethereum-mars/build/src/syntax/contract'
import { readContractAddress } from '../utils'
import {
  BorrowerSignatureVerifier,
  ManagedPortfolio,
  SignatureOnlyLenderVerifier,
  WhitelistLenderVerifier,
  GlobalWhitelistLenderVerifier,
  MockUsdc,
} from '../../build/artifacts'
import { config } from './ragnarok/config'
import {
  deployBulletLoans,
  deployManagedPortfolioFactory,
  deployProtocolConfig,
} from './ragnarok/tasks'

const { duration, maxSize, managerFee, depositMessage } = config.managedPortfolio

export function deployRagnarok(deployer: string, { networkName, deploymentsFile }: ExecuteOptions) {
  const borrowerVerifier = contract(BorrowerSignatureVerifier)
  const signatureOnlyLenderVerifier = contract(SignatureOnlyLenderVerifier, [depositMessage])
  const globalWhitelistLenderVerifier = contract(GlobalWhitelistLenderVerifier)
  const whitelistLenderVerifier = contract(WhitelistLenderVerifier)
  const bulletLoans = deployBulletLoans(borrowerVerifier)
  const protocolConfig = deployProtocolConfig()
  const managedPortfolioImplementation = contract(ManagedPortfolio)
  const managedPortfolioFactory = deployManagedPortfolioFactory(bulletLoans, protocolConfig, managedPortfolioImplementation)

  const deployTestnetContracts = () => {
    const usdcAddress = readContractAddress(deploymentsFile, networkName, 'mockUsdc')
    const usdc = makeContractInstance('mockUsdc', MockUsdc, new Future(() => usdcAddress))
    managedPortfolioFactory.setIsWhitelisted(deployer, true)
    managedPortfolioFactory.createPortfolio('Managed Portfolio', 'MP', usdc, signatureOnlyLenderVerifier, duration, maxSize, managerFee)
    const managedPortfolio = managedPortfolioFactory.getPortfolios().map(portfolios => portfolios[portfolios.length - 1])
    saveContract('managedPortfolio_proxy', managedPortfolio)
    return {
      usdc,
      managedPortfolio,
    }
  }

  const isTestnet = networkName !== 'mainnet' && networkName !== 'optimism'

  return {
    borrowerVerifier,
    signatureOnlyLenderVerifier,
    globalWhitelistLenderVerifier,
    whitelistLenderVerifier,
    bulletLoans,
    protocolConfig,
    managedPortfolioFactory,
    ...(isTestnet && deployTestnetContracts()),
  }
}
