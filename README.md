# Kebab Profitable 🥙

A small parody management game about indie hacking, made for
[Indie Hackers Lille](https://luma.com/indiehackerslille).

You have just signed your *rupture conventionnelle*. You have €2,500, a studio
in Lille, a kebab shop downstairs and one goal: **€270 of MRR**, the price of
a kebab a day. Run out of cash and it's *retour au CDI*.

The interface is in French and English. The jargon stays in English, as it
does at the apéro.

## How it plays

- A run starts on 1 January 2027. One turn is one day with three slots:
  matin, après-midi, soir.
- Nine actions: Coder, Shipper, Poster, Démarcher, Support, Freelance,
  Se reposer, Pivoter, and the monthly Apéro at Le Charlatan.
- Each midi you pick a meal: nothing, pâtes au beurre (€1), a kebab (€9) or a
  welsh (€16).
- Seven gauges: Faim, Énergie, Moral for you; Cash, MRR, Produit, Audience
  for the business.
- You pick one of three ideas. How well it really sells is hidden until you
  launch. When it flops, pivot.
- Each month-end takes €600 of rent and 22% of URSSAF on what you earned.
- Everyone plays the same seeded run each day, so the leaderboard compares
  decisions, not luck.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # rules engine tests
pnpm sim        # balance report: win rates per character
```

## Where things live

| Path | What |
| --- | --- |
| `src/game/engine.ts` | The rules. Pure TypeScript, no browser or server code. |
| `src/game/balance.ts` | Every tunable number. |
| `src/game/data/characters.ts` | The playable members and their perks. |
| `src/game/data/ideas.ts` | The fifteen project ideas. |
| `src/game/data/events.ts` | The event deck. |
| `src/game/data/chef.ts` | What the kebab shop owner says. |
| `src/game/sim/` | Scripted players used to tune the balance. |

## Add a card

Characters, ideas and events are plain data, with every text in French and
English. To add an event, copy one in `src/game/data/events.ts`, give it a new
`id` and describe what happens with `effect` (see `Effect` in
`src/game/types.ts`). Then run `pnpm test` and `pnpm sim` to check that
nothing broke and the balance holds, and open a pull request.

## About the people in the game

This is an affectionate parody. It is not affiliated with, endorsed by or
written with any of the public figures it mentions. They appear as pixel
versions of themselves, the lines are jokes and never quotes, and no card
makes fun of a real setback.

If you are named in the game and would rather not be, open an issue and the
card will be removed.

## Licence

MIT.
