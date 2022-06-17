import { env } from '../../common/env'

export const config = {
  deploymentsFile: 'deployments.json',
  managedPortfolio: {
    duration: env('MANAGED_PORTFOLIO_DURATION', 365 * 24 * 60 * 60), // 1 year,
    maxSize: env('MANAGED_PORTFOLIO_MAX_SIZE', 1e7),
    managerFee: env('MANAGED_PORTFOLIO_MANAGER_FEE', 100), // 1%
    depositMessage: env(
      'MANAGED_PORTFOLIO_DEPOSIT_MESSAGE',
      'By signing this transaction you are confirming that you are not a person or entity who resides in, is a citizen of, is located in, is incorporated in, or has a registered office in the United States of America (collectively “US Persons”). If you are a US Person then do not proceed with this transaction, or attempt to use a virtual private network (“VPN”) to circumvent the restrictions set forth herein.',
    ),
  },
  protocol: {
    fee: env('PROTOCOL_FEE', 1000), // 10%
  },
}
