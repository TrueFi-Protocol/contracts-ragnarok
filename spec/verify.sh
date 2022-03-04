#!/bin/bash
set -x

mkdir -p build
jq '{ dependencies, devDependencies }' package.json > ./build/package-extracted-deps.json
docker build -f spec/docker/Dockerfile . -t verify_ragnarok
docker run --rm -e CERTORAKEY -e HOST_PWD="$(pwd)" -v /var/run/docker.sock:/var/run/docker.sock -v $(pwd)/build:/root/build verify_ragnarok "$@"
