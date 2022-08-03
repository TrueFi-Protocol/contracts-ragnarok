import { env } from '../../common/env'
import { config as deploymentConfig } from '../../deployment/ragnarok/config'

export const config = {
  deploymentsFile: 'build/deployments.json',
  managedPortfolio: {
    duration: env('MANAGED_PORTFOLIO_DURATION', 365 * 24 * 60 * 60), // 1 year,
    maxSize: env('MANAGED_PORTFOLIO_MAX_SIZE', 1e7),
    managerFee: env('MANAGED_PORTFOLIO_MANAGER_FEE', 100), // 1%
    depositMessage: env(
      'MANAGED_PORTFOLIO_DEPOSIT_MESSAGE',
      deploymentConfig.managedPortfolio.depositMessage,
    ),
  },
  protocol: {
    fee: env('PROTOCOL_FEE', 1000), // 10%
  },
}
