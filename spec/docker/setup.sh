#!/bin/bash
set -eu

extract_json() {
    local json_file="$1"
    local key="$2"

    local python_command="import json,sys;obj=json.load(sys.stdin);print(obj['${key}'])"
    python3 -c "${python_command}" < "${json_file}"
}

extract_version() {
    RE="/[\d.]*\d/"
    # prints first match or exits with code 1
    echo "$1" | tr '\n' ' ' | perl -ne "($RE and print \$&) or exit(1)"
}

setup_solc() {
    echo "Setting up solc..." >&2
    local compiler_version="$(extract_version "$(extract_json .compiler.json version)")"

    echo "Found Hardhat compiler version ${compiler_version}." >&2
    solc-select install "${compiler_version}"
    solc-select use "${compiler_version}"
}

main() {
    setup_solc
}

main "$@"
