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

- A new run opens on a short intro: you walk home through Lille with your box
  on the evening you signed your rupture conventionnelle, and Chef, who owns
  the kebab shop downstairs, dares you to make more money than he does. It can
  be skipped at any moment.
- On a first run, Chef shows the way to a first customer: a five-step road
  that opens one step in (you have already quit the day job), a tip for the
  step you are on, and his pick outlined among the ideas and the actions. It
  goes once a first customer signs, or when hidden. The tips are checked
  against the sim (`src/ui/coach.test.ts`): a newcomer who follows them wins
  far more often. Karl is marked as the good first pick on the roster.
- A run starts on 1 January 2027. One turn is one day with three slots:
  matin, après-midi, soir.
- Nine actions: Coder, Shipper, Poster, Démarcher, Support, Freelance,
  Se reposer, Pivoter, and the monthly Apéro at Le Charlatan. On apéro day
  the game links to the real one, on
  [Luma](https://luma.com/indiehackerslille).
- Each midi you pick a meal: nothing, pâtes au beurre (€1), a kebab (€9) or a
  welsh (€16).
- Seven gauges: Faim, Énergie, Moral for you; Cash, MRR, Produit, Audience
  for the business.
- You pick one of three ideas. How well it really sells is hidden until you
  launch. When it flops, pivot.
- Each month-end takes €600 of rent and 22% of URSSAF on what you earned.
- Now and then an urgent card lands in the middle of a day: production is
  down, your coffee is heading for the keyboard. You get 6 or 8 seconds to
  choose between a safe answer and a gamble on your progress. Let the clock
  run out and you take the worst of it.
- Chef, who owns the kebab shop downstairs, coaches you whether you asked or
  not. About one lunch in two he looks at your numbers instead of your plate
  and says what he sees, in the words of your own forum: still not launched,
  no customers, followers but no sales. His shop makes money, and he would
  like you to notice. He has some hundred lines, dealt like a shuffled deck,
  so he does not repeat himself.
- The room shows what you are doing, and each thing has its own movement:
  elbows going at the keyboard, hearts rising from the phone while posting,
  pacing the rug with the phone at the ear for cold outreach, a hand on the
  chin in front of the wall chart for a pivot, hands in the air and a jump
  when something urgent lands, z's drifting up from the pillow.
- Between two days the room fades: the evening goes dark on whatever ended
  it, stays dark a moment, and the morning comes up.
- A new customer is a small victory, and is marked like one: a chest opens in
  the sound, and in the room the founder spins twice and throws a fist in the
  air, beaming, for two seconds.
- A run is short: a good player is kebab profitable in about 45 days, some
  200 clicks. `pnpm sim` prints the current figures.
- Everyone plays the same seeded run each day, so two runs of the same day
  compare decisions, not luck. The luck is the same for everyone playing the same
  founder: who drops by overnight, and which guest walks on at a milestone,
  change with the founder and with what you have done so far.
- Each month's report has a button that asks X for support: it opens the
  composer with the month's numbers and a thank-you to the last two guests
  met, by their handle, so that their followers see the game. Nothing is
  posted until the player presses the button on X.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # rules engine tests
pnpm sim        # balance report: win rates per character
pnpm art        # redraw the pixel art (see below)
pnpm audio      # re-render the sounds and the music (see below)
```

## The pixel art

All of the art is written as code in `art/kebab.px.js`: the room in each light
(morning, afternoon, rain, evening, night), the five characters in each pose,
and the props. The faces have their own file, `art/faces.px.js`, included by
the first: the members' portraits and the guests' avatars, all built on one
head turned three-quarters, the way a 16-bit role-playing game draws the faces
in its menus. The intro has its own file too, `art/intro.px.js`: a street much
wider than the screen, the skyline behind it, and Chef. So has the apéro,
`art/bar.px.js`: the back room of the bar, the long table, and everyone at it.
It is rendered with
[pxl](https://github.com/crsolver/claude-pxl), an MIT-licensed pixel-art tool,
and the resulting PNGs are committed in `public/art/`, so the game builds
without it.

The picture a link to the game is shared with is painted the same way, as the
scene `og`: 200 by 105, exported six times larger to
`src/app/opengraph-image.png`.

A saved win is shared with a picture of its own. The X post links to
`/v/fr/2026-11-19/flexbox/44`: the game, under a picture with the founder who
won, the days, the name and the place on that week's board. The backgrounds
are the scene `og_win`, exported once per founder to `assets/og/`, and
`src/server/card.tsx` writes the score on them when the picture is asked for.
The score is read from the leaderboard, never from the link, so a link cannot
show a score nobody made. The days are in the link so that a better run gets
a new link: X keeps the picture of a link it has already seen.

To change the art, clone the tool once, edit the file and rebuild:

```bash
git clone https://github.com/crsolver/claude-pxl.git .claude/skills/pxl-pixel-art
pnpm art
```

The finish follows the conventions of the Neo Geo's artists, and the art file
applies them for you:

- a ramp changes hue as it changes value: `darken` leans towards violet and
  `lighten` towards a warm white, so nothing is shaded with grey;
- an outline takes the colour of what it surrounds, darker on the side away
  from the light;
- one light, from the top left, falls on everything: it catches one edge of
  every shape and leaves the opposite edge in shade.

Draw a sprite flat, with its outline in `k`, and pass it through `figure`:
`relight` does the rest. In the room, `p.slab`, `p.strips`, `p.shine` and
`p.dim` do the same for furniture, metal, glass and corners.

Chef is drawn once, large, for the intro. That picture is the one to follow:
his portrait and his outline in the shop window are drawn after it, in the
same file. Change him there first.

The sign on the wall is a neon after dark. Its colour is `NEON` in the art
file, and its flicker is `FLICKER` in `src/ui/Room.tsx`. With reduced motion it
stays on without flickering.

## The sound

Every effect and every tune is written as code in `audio/kebab.cx.js`: the
effects the game plays (a click, the chest opened by a new customer, the
alarm on an urgent card), and three loops of music, one for the walk home in
the intro, one for Chef's dare, one for choosing a founder. They are original,
and in related keys, so one can follow another. Winning has its own four bars:
the dare's tune comes back in E major, and the band lands on one last chord.
Losing has four too: the same notes the other way round, going down, alone.
It is rendered with
[chirp](https://github.com/uilianks/chirp), an MIT-licensed synthesiser, and
the resulting MP3s are committed in `public/audio/`, so the game builds
without it.

To change a sound, clone the tool once, edit the file and rebuild. The export
needs `ffmpeg` on your path:

```bash
git clone https://github.com/uilianks/chirp.git .claude/skills/chirp
(cd .claude/skills/chirp && npm install --omit=dev --ignore-scripts)
pnpm audio
```

To hear what you are writing, `node .claude/skills/chirp/bin/chirp.js serve
audio/kebab.cx.js` opens a player that rebuilds on every save.

The music loops without a seam, whatever the browser: each MP3 ends with a
repeat of its own first second, and the game loops between two points exactly
one pass apart (see `audio/export.mjs` and `src/lib/sound.ts`). The speaker
button at the top of every screen turns everything off, and a hidden tab is
silent.

## Where things live

| Path | What |
| --- | --- |
| `src/game/engine.ts` | The rules. Pure TypeScript, no browser or server code. |
| `src/game/balance.ts` | Every tunable number. |
| `src/game/data/characters.ts` | The playable members and their perks. |
| `src/game/data/ideas.ts` | The fifteen project ideas. |
| `src/game/data/events.ts` | The event deck, answered at leisure in the morning. |
| `src/game/data/urgent.ts` | The urgent cards, answered against the clock. |
| `src/game/data/chef.ts` | What the kebab shop owner says, and on which occasion. Add a line to a list and he will say it. |
| `src/game/sim/` | Scripted players used to tune the balance. |
| `src/ui/` | The screens, and `pixels.ts`, which puts the room together from the art. |
| `src/ui/Intro.tsx` | The intro before a new run; `intro-pixels.ts` draws it. Its lines are `UI.intro` in `src/i18n/strings.ts`. |
| `art/` | The pixel art, as code: `kebab.px.js`, `faces.px.js`, `intro.px.js` and `bar.px.js`. Rendered into `public/art/`. |
| `audio/` | The sounds and the music, as code: `kebab.cx.js`. Rendered into `public/audio/`. |
| `src/lib/sound.ts` | Plays them: effects cut from one file, music in a loop. |
| `scripts/stripe-link.mjs` | Makes what the game sells, and its payment links, at Stripe. |
| `src/server/` | The leaderboard: it replays each submitted run before recording it. `card.tsx` draws the picture a win is shared with. |
| `assets/` | What that picture is made of: a background per founder, and the Silkscreen typeface. |

## Leaderboard

Scores are checked on the server: the browser sends the list of moves, the
server replays them with the same rules engine and records what the replay
finds. Nothing the browser claims is ranked.

- **Order:** fewer days to the kebab first, then more cash in the bank on the
  winning day, then the earlier score.
- **Boards:** "Cette semaine" holds each player's best run from Monday to
  Sunday, Paris time; each row says which day it was played. Everyone still
  plays the day's run: the board is weekly so that it is not empty most of
  the time. "Depuis toujours" holds each player's best run on any day.
- **Who is on it:** winning runs only. A run finished after midnight counts
  for the day before, which stays open one more day: Sunday's run finished
  on Monday goes to last week's board.
- **Names:** a free name of 2 to 16 characters, with no account. "Karl" and
  "karl" are the same player.
- **Limit:** 30 scores per 10 minutes from one address. It is wide because a
  whole bar on one Wi-Fi shares one address.

In development scores go to `.data/scores.json`. In production they go to
Upstash Redis, added to the Vercel project from the Marketplace and connected
to the production environment only:

```bash
vercel integration add upstash/upstash-kv
```

Without the database the deployed game plays normally and the leaderboard
says it is not open yet. Preview deployments stay that way on purpose, so
that a test run never reaches the real board.

### Remove a name

There is no admin screen. To remove a score, open the database from the
project's Storage tab on Vercel and run these in its command line. The name
key is the name in lower case, without accents, spaces or punctuation:
`Zoé 59` becomes `zoe59`.

```
HDEL kp:seed:2026-11-19 zoe59
HDEL kp:all zoe59
ZREM kp:best zoe59
```

The first line takes that day's score off the week's board: run it for each
day of the week the name played. The other two take it off the all-time
board.

## What it sells

The game is free. It sells two things, each once, through Stripe Payment Links:

- **a kebab, €9.** After a win, the end screen offers to buy the author a
  real one.
- **a founder card of your own, €27.** The last card of the roster: a
  pixel-art portrait and a playable card, drawn and balanced with the buyer by
  e-mail.

Stripe is added to the Vercel project from the Marketplace, and the links are
made by a script:

```bash
vercel integration add stripe
pnpm stripe:link    # prints NEXT_PUBLIC_KEBAB_LINK=... and NEXT_PUBLIC_FOUNDER_LINK=...
```

Put each address in its variable. While a variable is empty the game does not
offer that thing, so test links stay in the development environment and only
live ones go to production. For the live ones, run the script with a live key:
`STRIPE_SECRET_KEY=sk_live_... pnpm stripe:link`. After paying, the player
lands back on the title, where Chef says thank you.

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

An outcome can deal another card at once with `then`, in place of a result to
read. The VAT fine comes back this way when it is refused: three reminders in
a row, each dearer than the last. A card dealt by another one is never drawn
from the deck and needs no `when`. The first card's `minCash` has to cover the
whole chain, and the tests check that it does.

## The clock

The countdown on urgent cards runs in the browser only. To the rules engine
and to the leaderboard, a missed card is a move like any other, and it is
never the best one. There is no pause button: an urgent card leaves 6 or 8
seconds. The clock stops while the tab is hidden.

The intro plays by itself, one caption after another. With reduced motion it
is a series of stills, with every caption shown whole.

## About the people in the game

This is an affectionate parody. It is not affiliated with, endorsed by or
written with any of the public figures it mentions. They appear as pixel
versions of themselves, the lines are jokes and never quotes, and no card
makes fun of a real setback.

If you are named in the game and would rather not be, open an issue and the
card will be removed.

## Licence

MIT. The typeface on the share picture, Silkscreen, is under the SIL Open
Font License: see `assets/fonts/OFL.txt`.
