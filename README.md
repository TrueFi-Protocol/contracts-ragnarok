# 💰 TrueFi Lending Marketplace
##### Codename: ***Ragnarok***

## 🗂 Table of Contents
- [💡 Intro](#-Intro)
- [🧰 Installation](#-Installation)
- [✅ Testing](#-Testing)
- [🚢 Deployment](#-Deployment)
- [🔖 Contracts](#-Contracts)
- [🌊 Flow](#-Flow)

# 💡 Intro
TrueFi is a decentralized protocol for uncollateralized lending.
TrueFi Lending Marketplace enables third parties to create and manage portfolios of financial instruments (for the first version of the protocol see our previous [repository](https://github.com/trusttoken/smart-contracts)).
This repository contains smart contracts used in the first version of TrueFi Lending Marketplace.
Contracts are written in Solidity.
All key functionalities are tested with attached TypeScript test suite.
Apart from contracts and tests repository contains scripts used for deployment and maintenance of existing infrastructure.

# 🧰 Installation
In order to compile the contracts first clone the repository. In order to do that run
```
git clone git@github.com:trusttoken/contracts-ragnarok.git
```

**Important note:** You need to have `node` and `pnpm` already installed on your machine.

Install all required dependencies:
```
pnpm install
```

In order to compile the smart contracts run
```
pnpm run build
```
# ✅ Testing
In order to run test suite, run
```
pnpm run test
```
Make sure to install all dependencies and compile contracts first.

In order to run linter, run
```
pnpm run lint
```

In order to run typescript type checks, run
```
pnpm run typecheck
```

All three check suites can be run at once by running
```
pnpm run checks
```

# 🚢 Deployment
In order to perform deployment dry run, execute:
```
pnpm run deploy:dryrun
```
In order to deploy contracts run:
```
pnpm run deploy
```
**Important note:** Make sure to specify network and deployer private key, according to [Ethereum Mars documentation](https://ethereum-mars.readthedocs.io/en/latest/)

In order to run a local playground environment run:
```
pnpm run playground
```
# 🔖 Contracts
TrueFi Lending Marketplace consists of the following main smart contracts:
- `BulletLoans`
- `ManagedPortfolio`

And periphery smart contracts:
- `ManagedPortfolioFactory`
- `ProtocolConfig`
- `BorrowerSignatureVerifier`
- `ILenderVerifier`
  - `Whitelist`
  - `WhitelistLenderVerifier`
  - `SignatureOnlyLenderVerifier`

----
### BulletLoans
`BulletLoans` is an ERC-721 contract. Each of the tokens represents a single loan. All the loan parameters can be read from `LoanMetadata` struct. `BulletLoans` contract enables loan creation, facilitates loan repayment and allows managing the loan's state and parameters.


----
### ManagedPortfolio
`ManagedPortfolio` is an ERC-20 token facilitates funds management and allows loan issuance. Portfolio tokens represent depositors' share in the pooled funds. All of the portfolio operations are up to the managers discretion. Manager makes the decisions about issuing new loans, marking them as defaulted, altering portfolios params and so on. **Investors only deposit funds into the portfolio if they trust the manager is going to abide by a reasonable policy.** Manager also specifies an `ILenderVerifier` contract that is responsible for handling the permissions to join the portfolio (portfolios might be permissionless, but typically are not and only offer entrance to a defined group of investors). Funds from the portfolio are only available for the withdrawal after the final closing date.

----
### ManagedPortfolioFactory
Contract that allows easy portfolio configuration and creation. A particular instance of the factory can only be accessed by whitelisted addresses.

----
### ProtocolConfig
Contract holding key system params.


----
### BorrowerSignatureVerifier
A contract that verifies borrower's consent to change the loan parameters. Manager can freely change the loan parameters in borrower's favour (reduce owned amount, increase time), but needs an explicit, borrower's approval to do the opposite.

----
### ILenderVerifier
#### **Whitelist**
A contract that implements simple, universal whitelist.

#### **WhitelistLenderVerifier**
A contract that implements a unique whitelist for each of the portfolios, which are using this verifier. Managers of particular portfolios have the authority to manage respective whitelists.

#### **SignatureOnlyLenderVerifier**
A contract that requires lender to provide a signature of a predefined message.

## 🌊 Flow
Typical flow encounters:
- `Manager` creating `ManagedPortfolio` using `ManagedPortfolioFactory`.
- `Investor` depositing funds into the `ManagedPortfolio`.
- `Manager` issuing a `BulletLoans` token to the `ManagedPortfolio` (and sending funds to the `Borrower` by doing so).
- `Borrower` repaying `BulletLoans` an owed amount (`BulletLoans` will send funds to the debt owner - in this case the `ManagedPortfolio`).
- `Investor` withdrawing funds from the `ManagedPortfolio`.

Additional actions that might happen:
- `Manager` can change loan parameters (with a `Borrower`'s approval if necessary).
- `Manager` can set loan status to `Defaulted` if `Borrower` does not return funds on time (and eventually set lean status to `Resolved` once the debt is settled).
- `Manager` can change various `ManagedPortfolio` properties.
