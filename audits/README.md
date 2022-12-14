The following are some known issues in TrueFi Lending Marketplace V1, as of 2022-02-18. We intend to address some of these issues in future versions of the protocol.

Reports for these issues are not eligible for bug bounty awards.

| IDs | Status | Issue |
| -- | -- | -- |
| GITCOIN-SA64-5, SOLIDIFIED-1 | Working As Intended | Centralization risk: portfolio manager can access and remove all funds |
| CHAINSULTING-5.1.4, GITCOIN-NMQ-1 | Working As Intended | Centralization risk: portfolio manager could lend to any "borrower" address without consent; portfolio manager can lend to ManagedPortfolio to "manipulate" portfolio value |
| CHAINSULTING-5.1.2, GITCOIN-SA64-2, SOLIDIFIED-17 | Working As Intended | BulletLoans: createLoan() has no access controls, hence anyone can create a loan for anyone |
| INTERNAL-2022-01-05, SOLIDIFIED-6 | Won't Fix | SignatureValidator: any untrusted contract can bypass the non-US citizen ringfence to deposit into the portfolio using EIP-1271 |
| INTERNAL-2022-01-16, SOLIDIFIED-4 | Won't Fix | ManagedPortfolio + BorrowerSignatureVerifier: updateLoanParameters() signatures can be replayed or reordered |
| INTERNAL-2022-01-18 | Won't Fix | SignatureValidator: deposits from Gnosis Safes and other wallet contracts may not be supported due to EIP-1271 implementation |
| SOLIDIFIED-2 | Won't Fix | ManagedPortfolio: deposits will eventually fail when too many loans have been created for a particular portfolio |
| INTERNAL-2022-01-06 | Won't Fix | ManagedPortfolio: transfers to a portfolio with zero totalSupply can result in locked funds |
| CHAINSULTING-5.1.3, SOLIDIFIED-9 | Working As Intended | BulletLoans + ManagedPortfolio: loans can be marked as defaulted even before repay date |
| SOLIDIFIED-15 | Working As Intended | BulletLoans: updateLoanParameters() can update ‘Defaulted’ and other non-'Issued' loans |
| SOLIDIFIED-13 | Working As Intended | ManagedPortfolio: withdraw() does not update totalDeposited |
| SOLIDIFIED-14 | Won't Fix | BulletLoans: initialize() does not validate _borrowerSignatureVerifier |
| SOLIDIFIED-19 | Won't Fix | BulletLoans + ProtocolConfig: absence of zero address validation |
| CHAINSULTING-5.1.6 | Working As Intended | ManagedPortfolio: explicit variable initialization with default 0 values |
| CHAINSULTING-5.1.8 | Working As Intended | BulletLoans: inefficient storing of uints inside LoanMetadata struct |
| CHAINSULTING-5.1.10 | Working As Intended | ManagedPortfolio + ILenderVerifier: unused function variables (bytes and amount) |
| CHAINSULTING-5.1.5 | Won't Fix | All: missing natspec documentation |
