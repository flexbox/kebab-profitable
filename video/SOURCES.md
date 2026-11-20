# Sources

Every number on screen, and where it comes from.

| On screen | Value | Source |
| --- | --- | --- |
| €1,500 in the bank | €1,500 | `B.startCash`, `src/game/balance.ts`; the README ("You have €1,500") |
| Rent: €600 a month | €600 | `B.rent`, `src/game/balance.ts`; the README ("Each month-end takes €600 of rent") |
| Goal: €270 MRR | €270 | the README ("one goal: €270 of MRR"); `public/llms.txt` |
| A €9 kebab a day | €9 | the kebab meal is €9 (README, `src/game/data/meals.ts`); €9 × 30 days = €270 |
| Three moves a day | 3 | one turn is one day with three slots (README) |
| "Profitable since day one." | a quote | Chef's line, `src/game/data/chef.ts`: "See that spit? Profitable since day one." |
| Run 1, day by day: cash, MRR, the minus amounts at month-end | data | `src/runs.json`, written by `scripts/runs.ts`: seed `sim-36`, founder David, the expert bot with every "post" replaced by "code" |
| Broke on day 59 | day 59 | the same file: run 1 ends on day 59, reason "cash" |
| Run 2, day by day | data | the same file: the same seed and founder, the expert bot unchanged |
| Profitable, day 43 | day 43, MRR €280 | the same file: run 2 wins on day 43 with €280 of MRR |
| No posts: 9% win | 9% | `scripts/claims.ts`: 2,000 runs (5 founders × 400 seeds) of the expert bot with posting replaced by coding; 9% win |
| Posting: 96% win | 96% | `scripts/claims.ts`: the same 2,000 runs with the expert bot unchanged; 96% win (`pnpm sim` reports 92–98% per founder) |

Run them again:

```bash
npx tsx video/scripts/claims.ts   # the two win rates
npx tsx video/scripts/runs.ts     # rewrites video/src/runs.json
```

The balance numbers can change as the game is tuned. If they do, run both scripts again and fix the captions in `src/timeline.ts`.
