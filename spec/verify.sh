#!/bin/bash
set -eu
set -o pipefail

RE_VERIFIED_NOT_SANITY='.*Verified((?!_sanity).)*'
RE_VIOLATED_SANITY='.*Violated.*_sanity.*'

RE="(${RE_VERIFIED_NOT_SANITY})|(${RE_VIOLATED_SANITY})"

extract_version() {
    local text="$1"

    BASH_REMATCH=""
    [[ "${text}" =~ [0-9\.]+ ]]
    echo "${BASH_REMATCH}"
}

build_docker() {
    mkdir -p build

    jq '{ dependencies, devDependencies }' package.json > ./build/package-extracted-deps.json

    docker build -f spec/docker/Dockerfile . -t verify_ragnarok
}

build_confs() {
    echo "Building confs" >&2
    pnpm run build:verify
}

SANITY=''
FAIL_ON_FIRST=false

parse_args() {
    if [[ -z "${CERTORAKEY}" ]]; then
        echo "CERTORAKEY environment variable is empty." >&2
        exit 1
    fi

    echo "Found CERTORAKEY environment variable." >&2

    while getopts 'sf' flag; do
        echo "Found flag: $flag" >&2
        case "${flag}" in
            s) SANITY='--rule_sanity' ;;
            f) FAIL_ON_FIRST=true ;;
            *) exit 1 ;;
        esac
    done
}

ids=""

spawn_single_container() {
    conf="$1"
    id=$(docker run -d -e CERTORAKEY -e BRANCH -e ALL_SPEC -v $(pwd)/build:/root/build:ro verify_ragnarok $conf $SANITY)
    echo "Spawned $id"
    ids="$ids $id"
}

spawn_containers(){
    confs=$(find build -path '*/spec/*.conf')
    echo "Confs: \n $confs"  >&2>&2
    for conf in $confs; do
        spawn_single_container "$conf"
    done
}

RESULT=0

listen_single_container() {
    id="$1"
    if [ "$FAIL_ON_FIRST" == "false" ] || [ "$RESULT" == "0" ]; then
        echo "Listening to $id"  >&2
        docker logs -f $id | perl -ne "print if not /${RE}/"
        exit_code=$(docker inspect $id --format='{{.State.ExitCode}}')
        echo "Exit code: $exit_code" >&2
        if [ "$exit_code" != "0" ]; then
            RESULT=1
        fi
    else
        echo "Killing $id" >&2
        docker kill $id 2>/dev/null || true
    fi
    docker rm $id 2>/dev/null || true
}

listen_containers() {
    for id in $ids; do
        listen_single_container "$id"
    done
}

main() {
    build_docker
    build_confs
    parse_args "$@"
    spawn_containers
    listen_containers
    if [ "$RESULT" == "1" ]; then
        exit 1
    fi
}

main
