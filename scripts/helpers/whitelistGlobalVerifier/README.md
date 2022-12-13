# Whitelist addresses in GlobalWhitelistLenderVerfier
This script allows to whitelist multiple addresses in GlobalWhitelistLenderVerfier contract. To do that you need to put `.whitelist.txt` file in `/whitelistGlobalVerifier`. Addresses should be placed in separate rows, without new line at the end of file.

For example:
```
0x0000000000000000000000000000000000000001
0x0000000000000000000000000000000000000002
0x0000000000000000000000000000000000000003
```

To run the script type: `pnpm run whitelist:global` and pass proper arguments:
- `network (-n)` - network name
- `whitelist-contract (-w)` - address of GlobalWhitelistLenderVerifier contract
- `batch-size (-b)` - (optional) number of addresses whitelisted in one transaction

For example: `pnpm run whitelist:global -- -n goerli -w 0xbC0f50Fb1f782982441c405890dC638e0CfAF0d9`

You also need to have `.env` file in `/whitelistGlobalVerifier` with private key of GlobalWhitelistLenderVerifier manager specified in `PRIVATE_KEY` variable.

For example: `PRIVATE_KEY=0x0123456701234567012345670123456701234567012345670123456701234567`
