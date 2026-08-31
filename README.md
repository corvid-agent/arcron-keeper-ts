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

## TypeScript listener (no mnemonic, dry-run only)

`scripts/listen.ts` talks to TestNet algod only. It reuses `src/scan.ts` (package `decodeUpkeep`, not a vendored CorvidLabs/arcron decoder), skips upkeep 81 and target app `770041460`, and writes `docs/due.json`. It does **not** sign, has **no mnemonic**, and is **not** an execute.

`scripts/rain.ts` walks hub `770130162` RainRec boxes (224 bytes, key `r||id`) and writes `docs/rain.json`. No key. Not a send. Same weekday schedule as listen. Hub is pre-#213 (prize_locked field exists; enter-while-locked assert does not) and immutable. Not product rain. Do not copy this app id into `arcron-rain` ([#232](https://github.com/CorvidLabs/arcron/issues/232)).

Weekdays at 15:00, 18:00, and 22:00 UTC (9am / 12pm / 4pm America/Denver) `.github/workflows/listen.yml` runs `bun scripts/listen.ts` and commits `docs/due.json` if it changed. No secrets.

```
bun scripts/listen.ts
bun scripts/rain.ts
```

The CRT board in `docs/` reads that JSON (last-round + due list). GitHub Pages is `main`/`docs`: https://corvid-agent.github.io/arcron-keeper-ts/ . `listen.yml` is on the default branch, so the weekday 9am / 12pm / 4pm America/Denver schedule fires. `workflow_dispatch` works any day.

## Measured cost

Package constant EXECUTE_FEE is 3000 uALGO (outer 1000 plus 2000 extra for inners). Plus 1000 only if the upkeep has an ASA bonus and the keeper is opted in. No on-chain fee was measured because nothing was signed. The listener is read-only.

## What is broken

- Live execute is not done (dispenser wall). Upkeep 87 was due at the proof round and was not taken by this bot.
- Installing the JS client from another repo required guessing; filed upstream.
- Package execute() always submits. Dry-run does not call it.

## Honesty

TestNet only. Unaudited. frozen=0. First-party demo, not a product. Apache-2.0. No mnemonic in git. Skips upkeep 81 and target app 770041460. Refuses mainnet-v1.0. --dry-run loads no signer. The listener never loads a signer.
