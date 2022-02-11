while [ $# -gt 0 ]; do
   if [[ $1 == *"--"* ]]; then
        v="${1/--/}"
        declare $v="$2"
   fi
  shift
done
if [ -z "$testfiles" ]; then
  testfiles="test/{ragnarok}/**/*.test.ts"
fi
if [ -z "$solcoverjs" ]; then
  solcoverjs="./.solcover.js"
fi

echo "Run coverage for tests matching: '$testfiles'"
npx hardhat coverage --testfiles $testfiles --solcoverjs $solcoverjs --show-stack-traces || true
