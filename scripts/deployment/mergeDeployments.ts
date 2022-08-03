import { safeReadJsonFile, writeJsonFile } from '../utils'
import { existsSync, mkdirSync } from 'fs'

function mergeDeployment() {
  if (!existsSync('./build')) {
    mkdirSync('./build')
  }
  const merged = safeReadJsonFile('deployments-mainnet.json')
  merged['arbitrum-rinkeby'] = safeReadJsonFile('deployments-arbitrum-rinkeby.json')['arbitrum-rinkeby']
  merged['bounty-mainnet'] = safeReadJsonFile('deployments-bounty-mainnet.json')['bounty-mainnet']
  merged['ganache'] = safeReadJsonFile('deployments-ganache.json')['ganache']
  merged['goerli'] = safeReadJsonFile('deployments-goerli.json')['goerli']
  merged['optimism_kovan'] = safeReadJsonFile('deployments-optimism_kovan.json')['optimism_kovan']
  merged['optimism'] = safeReadJsonFile('deployments-optimism.json')['optimism']
  merged['rinkeby'] = safeReadJsonFile('deployments-rinkeby.json')['rinkeby']
  merged['ropsten'] = safeReadJsonFile('deployments-ropsten.json')['ropsten']
  writeJsonFile('build/deployments.json', merged)
}

mergeDeployment()
