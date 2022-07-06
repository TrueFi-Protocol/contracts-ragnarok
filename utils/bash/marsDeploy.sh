#!/bin/bash
set -eu

# Setting Infura or Alchemy key to use for convenience here
export ALCHEMY_KEY="b6z-86kKNaug7BhH8ydkFinnj4ZKSXp9"

# Setting Etherscan key to use for convenience here
export ETHERSCAN_KEY="RPKYAHCE6R2YI7TRV51WS5N8R885RRNXG3"

# Example usage:
# $ ./utils/bash/marsDeploy.sh deploy/truefi.ts --network ropsten --dry-run
# PRIVATE_KEY=0x123..64

# Consume the first argument as a path to the Mars deploy script.
# All other command line arguments get forwarded to Mars.
DEPLOY_SCRIPT="$1"
shift 1

network='mainnet'
args="$@"
dry_run='false'
force='false'

while [[ "$@" ]]; do
  case "$1" in
    --network)
      if [ "$2" ]; then
        network="$2"
        shift 1
      fi
      ;;
    --dry-run)
      dry_run='true'
      ;;
    --force)
      force='true'
      ;;
    -?)
      # ignore
      ;;
  esac
  shift 1
done

if [[ "${dry_run}" == 'false' ]]; then
    if [[ "$(git status --porcelain)" ]]; then
        echo "Error: git working directory must be empty to run deploy script."
        exit 1
    fi

    if [[ "$(git log --pretty=format:'%H' -n 1)" != "$(cat ./build/canary.hash)" ]]; then
        echo "Error: Build canary does not match current commit hash. Please run pnpm run build."
        exit 1
    fi
fi

if [[ "${force}" == 'false' ]]; then
    if [[ "$(pnpm ts-node spec/deployCheck.ts)" == 'false' ]]; then
        echo 'Error: The contracts are not fully formally verified. Please reenable missing formal verification or run with `--force`.'
        exit 1
    fi
fi

# Skip prompt if PRIVATE_KEY variable already exists
if [[ -z "${PRIVATE_KEY:-}" ]]; then
  # Prompt the user for a PRIVATE_KEY without echoing to bash output.
  # Then export PRIVATE_KEY to an environment variable that won't get
  # leaked to bash history.
  #
  # WARNING: environment variables are still leaked to the process table
  # while a process is running, and hence visible in a call to `ps -E`.
  echo "Enter a private key (0x{64 hex chars}) for contract deployment,"
  echo "or leave blank if performing a dry run without authorization."
  read -s -p "PRIVATE_KEY=" PRIVATE_KEY
  export PRIVATE_KEY
fi

# Log file name
network_log="-${network}"
target_file_name="$(basename -- ${DEPLOY_SCRIPT})"
target_log="-${target_file_name%.*}"
dry_run_log=''
if [[ "${dry_run}" == 'true' ]]; then
  dry_run_log='-dry-run'
fi
timestamp_log="-$(date +%s)"

pnpm mars
ts-node ${DEPLOY_SCRIPT} \
  --waffle-config ./.waffle.json \
  ${args} \
  --log "./cache/deploy${network_log}${target_log}${dry_run_log}${timestamp_log}.log"
