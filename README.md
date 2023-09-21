# EVM Bytecode Decompiler Signature & Topics Hashes _4byte_

```a
  examples:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: echo "NODE_VERSION=`node --version`" >> $GITHUB_ENV
      - uses: actions/cache@v3
        with:
          path: '**/node_modules'
          key: ${{ runner.os }}-${{ env.NODE_VERSION }}-modules-${{ hashFiles('**/yarn.lock') }}
      - run: yarn install --frozen-lockfile
      - run: yarn compile
      - run: node examples/Compound.mjs
      - run: node examples/DAI.js
      - run: node examples/UnicornToken.js
      - run: node examples/USDC.js

```
