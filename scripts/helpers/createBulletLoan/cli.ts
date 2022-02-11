import { ArgumentParser } from 'argparse'
import { Networkish } from '@ethersproject/providers'

export interface CliArgs {
  portfolioAddress: string,
  privateKey: string,
  network: Networkish,
  borrowerAddress: string,
}

export function getCliArgs (): CliArgs {
  const parser = new ArgumentParser({
    description: 'Creates bullet loan',
    prog: 'pnpm run bulletloan',
  })
  parser.add_argument('-p', '--private-key', {
    type: 'str',
    help: 'Private key of portfolio manager',
    required: true,
  })
  parser.add_argument('-n', '--network', {
    type: 'str',
    help: 'Network name',
    required: true,
  })
  parser.add_argument('-m', '--managed-portfolio-address', {
    type: 'str',
    help: 'Managed portfolio address',
  })
  parser.add_argument('-b', '--borrower', {
    type: 'str',
    help: 'Borrower address',
  })

  const args = parser.parse_args()

  return {
    portfolioAddress: args['managed_portfolio_address'],
    privateKey: args['private_key'],
    network: args.network,
    borrowerAddress: args.borrower,
  }
}
