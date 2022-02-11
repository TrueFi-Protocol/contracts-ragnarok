import { env } from '../../common/env'

export const config = {
  deploymentsFile: 'ragnarok.deployments.json',
  managedPortfolio: {
    duration: env('MANAGED_PORTFOLIO_DURATION', 365 * 24 * 60 * 60), // 1 year,
    maxSize: env('MANAGED_PORTFOLIO_MAX_SIZE', 1e7),
    managerFee: env('MANAGED_PORTFOLIO_MANAGER_FEE', 100), // 1%
    depositMessage: env('MANAGED_PORTFOLIO_DEPOSIT_MESSAGE', 'I agree to the terms and conditions'),
  },
  protocol: {
    fee: env('PROTOCOL_FEE', 1000), // 10%
  },
}
