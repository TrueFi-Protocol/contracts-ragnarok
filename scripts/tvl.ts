import { ManagedPortfolioFactory } from 'build/types'
import { BigNumber, Contract } from 'ethers'

export async function tvl(portfolioFactory: ManagedPortfolioFactory) {
  const portfolios = await portfolioFactory.getPortfolios()
  const balances = {}
  const tvl = {}
  for (let i = 0; i < portfolios.length; i++) {
    const portfolioContract = new Contract(portfolios[i], ['function value() view returns(uint256)', 'function underlyingToken() view returns(address)'], portfolioFactory.provider)
    const underlyingToken = await portfolioContract.underlyingToken()
    const value = await portfolioContract.value()
    if (!balances[underlyingToken]) {
      balances[underlyingToken] = []
    }
    balances[underlyingToken].push(value)
  }
  const underlyingTokens = Object.keys(balances)
  for (let i = 0; i < underlyingTokens.length; i++) {
    tvl[underlyingTokens[i]] = balances[underlyingTokens[i]].reduce((acc, curr) => acc.add(curr), BigNumber.from(0))
  }
  return tvl
}
