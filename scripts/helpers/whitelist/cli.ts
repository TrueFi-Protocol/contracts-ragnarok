import { ArgumentParser } from 'argparse'
import { Networkish } from '@ethersproject/providers'

export interface CliArgs {
  factoryAddress: string,
  addressToWhitelist: string,
  privateKey: string,
  network: Networkish,
}

export function getCliArgs (): CliArgs {
  const parser = new ArgumentParser({
    description: 'Adds address to portfolio factory whitelist',
    prog: 'pnpm run whitelist',
  })
  parser.add_argument('-f', '--factory-address', {
    type: 'str',
    help: 'Portfolio factory address',
  })
  parser.add_argument('-p', '--private-key', {
    type: 'str',
    help: 'Private key of factory manager',
    required: true,
  })
  parser.add_argument('-n', '--network', {
    type: 'str',
    help: 'Network name',
    required: true,
  })
  parser.add_argument('-w', '--whitelisted-address', {
    type: 'str',
    help: 'Address to whitelist',
    required: true,
  })

  const args = parser.parse_args()

  return {
    factoryAddress: args['factory_address'],
    privateKey: args['private_key'],
    network: args.network,
    addressToWhitelist: args['whitelisted_address'],
  }
}
