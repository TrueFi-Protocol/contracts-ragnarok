#!/usr/bin/env bash

if [ ! $(which python3) ]; then
  echo "python3 is required to run this script"
  exit 1
fi
if [ ! $(which pip3) ]; then
  echo "pip3 is required to run this script"
  exit 1
fi
if [ ! -d "venv" ]; then
  echo "Generating python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

pip3 install slither-analyzer --disable-pip-version-check
pip3 install solc-select --disable-pip-version-check

SOLC_VERSION=$(solc-select versions)
if [[ $SOLC_VERSION != *"0.8.10"* ]]; then
  solc-select install 0.8.10
fi
solc-select use 0.8.10

slither . --hardhat-artifacts-directory ./build
