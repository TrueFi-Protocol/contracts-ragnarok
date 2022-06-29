import { safeReadJsonFile } from './safeReadJsonFile'

export function readContractAddress(deploymentsFile: string, networkName: string, contractName: string): string {
  const deployments = safeReadJsonFile(deploymentsFile)
  return deployments[networkName][contractName].address
}
