#!/bin/bash
set -eu

extract_json() {
    local json_file="$1"
    local key="$2"

    local python_command="import json,sys;obj=json.load(sys.stdin);print(obj['${key}'])"
    python3 -c "${python_command}" < "${json_file}"
}

extract_version() {
    local text="$1"

    BASH_REMATCH=""
    [[ "${text}" =~ [0-9\.]+ ]]
    echo "${BASH_REMATCH}"
}

setup_solc() {
    echo "Setting up solc..." >&2
    local solc_version=""
    local solc_version="$(extract_version "$(solc --version)" || true)"
    local compiler_version="$(extract_version "$(extract_json .compiler.json version)")"

    echo "Found solc version ${solc_version} and Hardhat compiler version ${compiler_version}." >&2
    if [[ "${solc_version}" != "${compiler_version}" ]]; then
        echo "Updating solc version to ${compiler_version}..." >&2
        pip3 install solc-select
        solc-select install "${compiler_version}"
        solc-select use "${compiler_version}"
    fi
}

setup_certora() {
    echo "Setting up Certora..." >&2
    local certora_version=""
    local certora_version="$(extract_version "$(certoraRun --version)" || true)"
    local desired_version="3.1.0"

    echo "Found Certora version ${certora_version} and desired version ${desired_version}." >&2
    if [[ "${certora_version}" != "${desired_version}" ]]; then
        echo "Updating Certora version to ${desired_version}..." >&2
        pip3 install certora-cli==${desired_version}
    fi
}

main() {
    setup_solc
    setup_certora
}

main "$@"
