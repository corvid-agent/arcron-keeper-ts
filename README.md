# arcron-keeper-ts

A TestNet Arcron keeper that depends on the published `@corvidlabs/arcron` JS client and whose `--dry-run` never signs.

## Live proof

Against TestNet algod, keeper app `769891898`, 2026-08-30:

```
network  TestNet testnet-v1.0
app      769891898
round    66823675
mode     dry-run (signs nothing)
fee      EXECUTE_FEE=3000 uALGO (+1000 if ASA opted in)
SKIP id=81 target=770041460 fee=10000 next=66824344 skip list: upkeep 81
DUE  id=87 target=770082145 fee=20000 next=66793489
counts  due=1 skipped=1 waiting=26 total=28
dry-run: would call package execute() on due ids [87]
dry-run: no signer loaded, no transaction submitted.
```

No live execute was submitted. The TestNet dispenser is captcha-walled here, so there is no throwaway-funded account and no txid.

## How to run

```
bun scripts/fetch-arcron-js.ts
bun install
bun test
bun src/cli.ts --dry-run
```

`bun src/cli.ts --execute` needs KEEPER_MNEMONIC in a gitignored local .env. It still refuses MainNet genesis. Copy .env.example (TestNet URLs only).


## Measured cost

Package constant EXECUTE_FEE is 3000 uALGO (outer 1000 plus 2000 extra for inners). Plus 1000 only if the upkeep has an ASA bonus and the keeper is opted in. No on-chain fee was measured because nothing was signed.

## What is broken

- Live execute is not done (dispenser wall). Upkeep 87 was due at the proof round and was not taken by this bot.
- Installing the JS client from another repo required guessing; filed upstream.
- Package execute() always submits. Dry-run does not call it.

## Honesty

TestNet only. Unaudited. frozen=0. First-party demo, not a product. Apache-2.0. No mnemonic in git. Skips upkeep 81 and target app 770041460. Refuses mainnet-v1.0. --dry-run loads no signer.

