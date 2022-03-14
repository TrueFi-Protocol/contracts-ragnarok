#!/bin/bash
set -eu

main() {

    echo "Building confs" >&2

    pnpm run build:verify

    if [[ -z "${CERTORAKEY}" ]]; then
        echo "CERTORAKEY environment variable is empty." >&2
        exit 1
    fi

    echo "Found CERTORAKEY environment variable." >&2

    SANITY=''
    FAIL_ON_FIRST=false

    while getopts 'sf' flag; do
        echo "Found flag: $flag" >&2
        case "${flag}" in
            s) SANITY='--rule_sanity' ;;
            f) FAIL_ON_FIRST=true ;;
            *) exit 1 ;;
        esac
    done

    ids=""
    RESULT=0

    RE_VERIFIED_NOT_SANITY='.*Verified((?!_sanity).)*'
    RE_VIOLATED_SANITY='.*Violated.*_sanity.*'

    RE="(${RE_VERIFIED_NOT_SANITY})|(${RE_VIOLATED_SANITY})"

    set -o pipefail
    confs=$(find build -path '*/spec/*.conf')
    echo "Confs: \n $confs"  >&2>&2
    for conf in $confs; do
        id=$(docker run -d -e CERTORAKEY -v $HOST_PWD/build:/root/build:ro --entrypoint certoraRun verify_ragnarok $conf $SANITY)
        echo "Spawned $id"
        ids="$ids $id"
    done

    for id in $ids; do
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
    done

    if [ "$RESULT" == "1" ]; then
        exit 1
    fi
}

main "$@"
