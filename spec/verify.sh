#!/bin/bash
set -eu

extract_version() {
    local text="$1"

    BASH_REMATCH=""
    [[ "${text}" =~ [0-9\.]+ ]]
    echo "${BASH_REMATCH}"
}

freeze_latest_pip_requirements() {
    while read line ; do
        local latest_version="$(extract_version "$(pip3 index versions $line)")"
        echo "$line==$latest_version"
    done
}

mkdir -p build

jq '{ dependencies, devDependencies }' package.json > ./build/package-extracted-deps.json
freeze_latest_pip_requirements <requirements.txt >./build/requirements-frozen.txt

docker build -f spec/docker/Dockerfile . -t verify_ragnarok

docker run --rm -e CERTORAKEY -e HOST_PWD="$(pwd)" -v /var/run/docker.sock:/var/run/docker.sock -v $(pwd)/build:/root/build verify_ragnarok "$@"
