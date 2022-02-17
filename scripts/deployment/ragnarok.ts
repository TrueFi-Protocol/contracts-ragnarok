import dotenv from 'dotenv'
import { contract, deploy } from 'ethereum-mars'
import {
  BorrowerSignatureVerifier,
  ManagedPortfolio,
  MockUsdc,
  SignatureOnlyLenderVerifier,
  WhitelistLenderVerifier,
  LoansReader,
  GlobalWhitelistLenderVerifier,
} from '../../build/artifacts'
import {
  deployBulletLoans,
  deployManagedPortfolio,
  deployManagedPortfolioFactory,
  deployProtocolConfig,
} from './ragnarok/tasks'
import { config } from './ragnarok/config'

dotenv.config({
  path: `${__dirname}/.env`,
})

deploy({ verify: true }, (_, { networkName }) => {
  const borrowerVerifier = contract(BorrowerSignatureVerifier)
  const signatureLenderVerifier = contract(SignatureOnlyLenderVerifier, [config.managedPortfolio.depositMessage])
  contract(GlobalWhitelistLenderVerifier)
  contract(WhitelistLenderVerifier)
  contract(LoansReader)
  const bulletLoans = deployBulletLoans(borrowerVerifier)
  const protocolConfig = deployProtocolConfig()
  const managedPortfolioImplementation = contract(ManagedPortfolio)
  const factory = deployManagedPortfolioFactory(bulletLoans, protocolConfig, managedPortfolioImplementation)

  if (networkName !== 'mainnet') {
    const usdc = contract(MockUsdc)
    deployManagedPortfolio(usdc, factory, signatureLenderVerifier)
  }
})
