# Kebab Profitable 🥙

A small parody management game about indie hacking, made for
[Indie Hackers Lille](https://luma.com/indiehackerslille).

**Play it: https://kebab-profitable.vercel.app**

You have just signed your *rupture conventionnelle*. You have €1,500, a studio
in Lille, a kebab shop downstairs and one goal: **€270 of MRR**, the price of
a kebab a day. Run out of cash and it's *retour au CDI*.

The interface is in French and English. The jargon stays in English, as it
does at the apéro.

The interface is a calm dark-navy layout inspired by the Indie Hackers
website, around a pixel-art room in the style of 16-bit role-playing games:
seen from three-quarters above, with outlined, shaded little characters. All
of the art is original and written as code, and the game is not affiliated
with indiehackers.com.

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
- Now and then an urgent card lands in the middle of a day: production is
  down, your coffee is heading for the keyboard. You get about ten seconds to
  choose between a safe answer and a gamble on your progress. Let the clock
  run out and you take the worst of it.
- A run is short: a good player is kebab profitable in about 45 days, some
  200 clicks. `pnpm sim` prints the current figures.
- Everyone plays the same seeded run each day, so the leaderboard compares
  decisions, not luck.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # rules engine tests
pnpm sim        # balance report: win rates per character
pnpm art        # redraw the pixel art (see below)
```

## The pixel art

All of the art is written as code in `art/kebab.px.js`: the room in each light
(morning, afternoon, rain, evening, night), the five characters in each pose,
the portraits and the props. It is rendered with
[pxl](https://github.com/crsolver/claude-pxl), an MIT-licensed pixel-art tool,
and the resulting PNGs are committed in `public/art/`, so the game builds
without it.

To change the art, clone the tool once, edit the file and rebuild:

```bash
git clone https://github.com/crsolver/claude-pxl.git .claude/skills/pxl-pixel-art
pnpm art
```

## Where things live

| Path | What |
| --- | --- |
| `src/game/engine.ts` | The rules. Pure TypeScript, no browser or server code. |
| `src/game/balance.ts` | Every tunable number. |
| `src/game/data/characters.ts` | The playable members and their perks. |
| `src/game/data/ideas.ts` | The fifteen project ideas. |
| `src/game/data/events.ts` | The event deck, answered at leisure in the morning. |
| `src/game/data/urgent.ts` | The urgent cards, answered against the clock. |
| `src/game/data/chef.ts` | What the kebab shop owner says. |
| `src/game/sim/` | Scripted players used to tune the balance. |
| `src/ui/` | The screens, and `pixels.ts`, which puts the room together from the art. |
| `art/` | The pixel art, as code: `kebab.px.js`. Rendered into `public/art/`. |
| `src/server/` | The leaderboard: it replays each submitted run before recording it. |

## Leaderboard

Scores are checked on the server: the browser sends the list of moves, the
server replays them with the same rules engine and records the day the replay
finds. In development scores go to `.data/scores.json`. In production they go
to Upstash Redis, added to the Vercel project from the Marketplace:

```bash
vercel integration add upstash/upstash-kv
```

Until that is done the deployed game plays normally and the leaderboard says
it is not open yet.

## Add a card

Characters, ideas and events are plain data, with every text in French and
English. To add an event, copy one in `src/game/data/events.ts`, give it a new
`id` and describe what happens with `effect` (see `Effect` in
`src/game/types.ts`). Then run `pnpm test` and `pnpm sim` to check that
nothing broke and the balance holds, and open a pull request.

An urgent card is the same thing with a clock, in `src/game/data/urgent.ts`:
`urgent.seconds` on the counter and `urgent.missed` for what happens when it
runs out. Keep its text short, because it is read while the counter runs, and
guard anything that costs money with `minCash`: the tests refuse a card that
could end a run by itself.

## The clock

The countdown on urgent cards runs in the browser only. To the rules engine
and to the leaderboard, a missed card is a move like any other, and it is
never the best one. The stopwatch button at the top of every screen turns the
countdown off for players who need more time; the cards then wait like the
others. The clock also stops while the tab is hidden.

## About the people in the game

This is an affectionate parody. It is not affiliated with, endorsed by or
written with any of the public figures it mentions. They appear as pixel
versions of themselves, the lines are jokes and never quotes, and no card
makes fun of a real setback.

If you are named in the game and would rather not be, open an issue and the
card will be removed.

## Licence

MIT.
