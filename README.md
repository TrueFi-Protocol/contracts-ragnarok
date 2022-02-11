# 💰 TrueFi Protocol v2

## 🗂 Table of Contents
- [💡 Intro](#-Intro)
- [🧰 Installation](#-Installation)
- [✅ Testing](#-Testing)

# 💡 Intro
TrueFi is a decentralized protocol for uncollateralized lending.
TrueFi Protocol v2 enables third parties to create and manage portfolios of financials instruments (for the first version of the protocol see our previous [repository](https://github.com/trusttoken/smart-contracts)).
This repository contains smart contracts used in Protocol v2.
Contracts are written in Solidity.
All key functionalities are tested with attached TypeScript test suite.
Apart from contracts and tests repository contains scripts used for deployment and maintenance of existing infrastructure.

# 🧰 Installation
In order to compile the contracts first clone the repository. In order to do that run
```
git clone git@github.com:trusttoken/monorepo.git
```

**Important note:** You need to have `node` and `pnpm` already installed on your machine.

Install all required dependencies:
```
pnpm install
```

Then enter `packages/contracts` package.

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
