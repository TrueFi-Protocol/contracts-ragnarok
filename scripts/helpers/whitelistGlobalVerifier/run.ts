import { GlobalWhitelistLenderVerifier__factory } from '../../../build/types/factories/GlobalWhitelistLenderVerifier__factory'
import { GlobalWhitelistLenderVerifier } from 'build/types/GlobalWhitelistLenderVerifier'
import GlobalWhitelistLenderVerifierJson from '../../../build/GlobalWhitelistLenderVerifier.json'
import { setupWallet } from '../shared/setupWallet'
import { CliArgs, getCliArgs } from './cli'
import { Contract, utils, Wallet } from 'ethers'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { sendTransactionAndWait } from '../shared/sendTransactionAndWait'

dotenv.config({ path: path.join(__dirname, '.env') })

const MULTICALL2_ABI = [
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) public view returns (tuple(bool success, bytes returnData)[])',
]

// it's the same address for Mainnet, Ropsten and Rinkeby
const MULTICALL2_ADDRESS = '0x5ba1e12693dc8f9c48aad8770482f4739beed696'

const ADDRESSES_PATH = path.join(__dirname, '.whitelist.txt')
const DEFAULT_BATCH_SIZE = 1000

function validateAddress(address: string, errorMessage: string) {
  if (!utils.isAddress(address)) {
    throw new Error(errorMessage)
  }
}

function prepare(cliArgs: CliArgs) {
  const { network, whitelistContractAddress, batchSize } = cliArgs
  validateAddress(whitelistContractAddress, 'Invalid Whitelist contract address')
  const wallet = setupWallet(network, process.env.PRIVATE_KEY)
  return { wallet, whitelistContractAddress, batchSize: batchSize ?? DEFAULT_BATCH_SIZE }
}

function readAddresses() {
  const addresses = fs.readFileSync(ADDRESSES_PATH).toString().split('\n')
  addresses.forEach((address, idx) => validateAddress(address, `Invalid Ethereum address: ${address} (line: ${idx})`))
  return addresses
}

async function whitelistAddresses(whitelistVerfier: GlobalWhitelistLenderVerifier, wallet: Wallet, addresses: string[], batchSize: number) {
  const batchesNumber = Math.ceil(addresses.length / batchSize)
  for (let i = 0; i < batchesNumber; i++) {
    const start = i * batchSize
    const addressesBatch = addresses.slice(start, start + batchSize)
    const description = `Do you want to whitelist addresses from positions ${start}-${start + addressesBatch.length - 1} [batch: ${i + 1}/${batchesNumber}]`
    const transaction = await whitelistVerfier.populateTransaction.setWhitelistStatusForMany(addressesBatch, true)
    await sendTransactionAndWait(wallet, description, transaction)
  }
}

async function checkIfWhitelisted(whitelistVerfier: GlobalWhitelistLenderVerifier, addresses: string[], wallet: Wallet) {
  const globalWhitelistInterface = new utils.Interface(GlobalWhitelistLenderVerifierJson.abi)
  const multicallContract = new Contract(MULTICALL2_ADDRESS, new utils.Interface(MULTICALL2_ABI), wallet)

  const calls = addresses.map(address => ({
    address: whitelistVerfier.address,
    data: globalWhitelistInterface.encodeFunctionData('isWhitelisted', [address]),
  }))

  const resultsEncoded = await multicallContract.tryAggregate(
    false,
    calls.map(({ address, data }) => [address, data]),
  )

  // TODO: print not whitelisted addresses to file
  const resultsDecoded = resultsEncoded.map(([success, data], idx) => {
    const isWhitelisted = success ? globalWhitelistInterface.decodeFunctionResult('isWhitelisted', data)[0] : undefined
    if (isWhitelisted === false) {
      throw new Error(`Address ${addresses[idx]} did not get whitelisted`)
    }
    return isWhitelisted
  })

  if (resultsDecoded.every(isWhitelisted => !!isWhitelisted)) {
    console.log('All addresses are whitelisted now')
  } else {
    console.log('Unable to check whitelisting results')
  }
}

async function getWhitelistVerifier(whitelistContractAddress: string, wallet: Wallet) {
  const whitelistVerfier = GlobalWhitelistLenderVerifier__factory.connect(whitelistContractAddress, wallet)
  const managerAddress = await whitelistVerfier.manager()
  if (wallet.address !== managerAddress) {
    throw new Error(`${wallet.address} is not the address of GlobalWhitelistLenderVerifier manager: ${managerAddress}`)
  }
  return whitelistVerfier
}

async function run(cliArgs: CliArgs) {
  try {
    const { wallet, whitelistContractAddress, batchSize } = prepare(cliArgs)
    const addresses = readAddresses()
    const whitelistVerfier = await getWhitelistVerifier(whitelistContractAddress, wallet)
    await whitelistAddresses(whitelistVerfier, wallet, addresses, batchSize)
    await checkIfWhitelisted(whitelistVerfier, addresses, wallet)
    console.log('DONE ⭐️')
  } catch (e) {
    console.error(e.message)
  }
}

run(getCliArgs())
