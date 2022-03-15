import { ArgumentParser } from 'argparse'
import { Networkish } from '@ethersproject/providers'

export interface CliArgs {
  whitelistContractAddress: string,
  network: Networkish,
  batchSize?: number,
}

export function getCliArgs(): CliArgs {
  const parser = new ArgumentParser({
    description: 'Whitelists multiple addresses in GlobalWhitelistLenderVerifier contract',
    prog: 'pnpm run whitelist:global',
  })
  parser.add_argument('-w', '--whitelist-contract', {
    type: 'str',
    help: 'Address of GlobalWhitelistLenderVerifier contract',
    required: true,
  })
  parser.add_argument('-n', '--network', {
    type: 'str',
    help: 'Network name',
    required: true,
  })
  parser.add_argument('-b', '--batch-size', {
    type: 'int',
    help: 'Number of addresses whitelisted in one transaction',
  })

  const args = parser.parse_args()

  return {
    network: args.network,
    whitelistContractAddress: args['whitelist_contract'],
    batchSize: args['batch_size'],
  }
}
