import { readFileSync, writeFileSync } from 'fs'

type Addresses = Record<string, {address: string}>

export function saveAddressesToFile(addresses: Addresses, deploymentsFile: string) {
  let deployments = {}

  try {
    const fileContent = readFileSync(deploymentsFile)
    const json = JSON.parse(fileContent.toString())
    deployments = json
  } catch {
    console.log('File not found')
  }

  deployments['ganache'] = addresses

  writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2))
}
