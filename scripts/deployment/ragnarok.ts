import dotenv from 'dotenv'
import { contract, deploy } from 'ethereum-mars'
import {
  BorrowerSignatureVerifier,
  ManagedPortfolio,
  SignatureOnlyLenderVerifier,
  WhitelistLenderVerifier,
  GlobalWhitelistLenderVerifier,
} from '../../build/artifacts'
import {
  deployBulletLoans,
  deployManagedPortfolioFactory,
  deployProtocolConfig,
} from './ragnarok/tasks'
import { config } from './ragnarok/config'

dotenv.config({
  path: `${__dirname}/.env`,
})

deploy({ verify: true }, () => {
  const borrowerVerifier = contract(BorrowerSignatureVerifier)
  contract(SignatureOnlyLenderVerifier, [config.managedPortfolio.depositMessage])
  contract(GlobalWhitelistLenderVerifier)
  contract(WhitelistLenderVerifier)
  const bulletLoans = deployBulletLoans(borrowerVerifier)
  const protocolConfig = deployProtocolConfig()
  const managedPortfolioImplementation = contract(ManagedPortfolio)
  deployManagedPortfolioFactory(bulletLoans, protocolConfig, managedPortfolioImplementation)
})
