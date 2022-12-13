import { safeReadJsonFile, writeJsonFile } from '../utils'
import { existsSync, mkdirSync } from 'fs'

function mergeDeployments() {
  if (!existsSync('./build')) {
    mkdirSync('./build')
  }
  const merged = safeReadJsonFile('deployments-mainnet.json')
  merged['arbitrum-rinkeby'] = safeReadJsonFile('deployments-arbitrum-rinkeby.json')['arbitrum-rinkeby']
  merged['bounty-mainnet'] = safeReadJsonFile('deployments-bounty-mainnet.json')['bounty-mainnet']
  merged['ganache'] = safeReadJsonFile('deployments-ganache.json')['ganache']
  merged['goerli'] = safeReadJsonFile('deployments-goerli.json')['goerli']
  merged['optimism_goerli'] = safeReadJsonFile('deployments-optimism_goerli.json')['optimism_goerli']
  merged['optimism'] = safeReadJsonFile('deployments-optimism.json')['optimism']
  merged['rinkeby'] = safeReadJsonFile('deployments-rinkeby.json')['rinkeby']
  merged['ropsten'] = safeReadJsonFile('deployments-ropsten.json')['ropsten']
  writeJsonFile('build/deployments.json', merged)
}

mergeDeployments()
