# Product Marketing Context

**Document version:** v3
**Last updated:** 2026-11-26

> Written from the repo, the live leaderboard, the Luma page, Vercel Analytics
> and the Product Hunt draft. David confirmed the goal and the sales figure on
> 2026-11-26. Lines marked **(to confirm)** are still my reading. Nothing in
> here comes from a player interview yet.

## Product Overview
**One-liner:** A free browser game where you quit your job and try to reach €270 of MRR, the price of a kebab a day, before the rent eats your savings.

**What it does:** You play a member of Indie Hackers Lille who has just signed a rupture conventionnelle: €1,500, a studio in Lille, a kebab shop downstairs. Each day has three slots (code, ship, post, reach out, support, freelance, rest, pivot, apéro), a lunch to pick, and rent plus 22% URSSAF at month-end. Everyone plays the same seeded run each day, and winning runs go on a weekly and an all-time leaderboard that the server replays before ranking.

**What it teaches (the point of the game):** how an indie hacker actually works. The lesson the balance is built around: talk about what you build, don't only build it. The same expert run wins 96 times in 100 when it posts and 9 in 100 when it codes instead (2,000 simulated runs, measured 2026-11-20; re-run `npx tsx video/scripts/claims.ts` before citing, the balance has moved since).

**Product category:** Parody management game / startup simulator. On Product Hunt: Games. In search (FR): "jeu de gestion indie hacker".

**Product type:** Free web game, open source (MIT), French and English, no account, no download. Also the front door of a real monthly meetup.

**Business model:** Free to play. Two one-off purchases through Stripe Payment Links:
- a real kebab for the author, €9, offered after a win;
- a founder card of your own, €27 ("trois kebabs"): a pixel portrait and a playable card, drawn and balanced with the buyer by e-mail. Capped at ten seats (decided 2026-11-26; the game does not show the count yet).

The kebab is offered after a win today. It will be offered after a loss too (decided 2026-11-26, not built yet).

Nothing sold is recurring. "Kebab profitable" for the game itself means €270 in a month: 30 kebabs, or 10 founder cards.

**Who makes it:** David Leuliette (@flexbox_), organiser of Indie Hackers Lille. Built in about a week with AI (first commit 2026-11-15). Members add cards by pull request.

## Target Audience
**Not companies: people.** B2C, so no Personas section.

**Primary:** French-speaking developers and makers who run a side project or think about quitting a CDI to run one. Starting with the members and friends of Indie Hackers Lille, then the French indie scene on X.

**Secondary:** Product Hunt makers and the English-speaking indie hacker crowd on X. They already believe "ship it and they will come", and that belief is the hook (decision recorded in `video/DECISIONS.md`).

**Distribution nodes, not customers:** the people who appear in the game. Five playable members (David, Karl, Mickael, Christophe, Matthys) and 13 cameos with their X handle (Pieter Levels, Marc Lou, Tibo, Dagobert Renouf, Nico Jeannen, Thomas Sanlis, Tony Dinh, Danny Postma, Arvid Kahl, Benjamin Code, Flavie Prévot, Indie Hackers, Raycast). Each cameo card has a "Thank @handle on X" button. The cameos have not been told they are in the game: David will post one thread with every cameo on Product Hunt day, not write to them beforehand.

**The meetup's own words for who it is for:** "ouvert à tous : développeurs, designers, marketeurs, solopreneurs et curieux". "100 % gratuit".

**Primary use case:** Ten idle minutes that leave you with one real lesson about going indie, and a score to dare a friend with.

**Jobs to be done:**
- Let me feel what quitting my job to go indie is like, without quitting.
- Give me something to send to the friend who keeps building and never posts.
- Give me a reason to turn up at the next apéro, and something to talk about once I am there. **(to confirm)**

**Use cases:**
- A member plays the day's run on the way to the apéro and compares days-to-kebab at the bar.
- A French dev sees a "44 jours pour être kebab profitable, bats-moi" post on X and plays to beat it.
- A Product Hunt visitor watches the 48-second film, plays one run in English, learns that posting is the move.
- A newcomer to Lille finds the game, sees "L'apéro existe aussi en vrai", follows the Luma link.

## Problems & Pain Points
**Core problem:** Most people who try indie hacking build in silence. They ship, nobody comes, the savings run out, and they go back to a job without having learned why. The advice that would have helped is scattered across threads and podcasts, mostly in English, mostly told by the people it worked for.

**Why alternatives fall short:**
- Threads, podcasts and MRR screenshots tell you to "build in public". You nod and keep coding.
- Startup games play the venture story: raise, hire, scale. Nothing about being alone with €1,500 and a rent.
- None of it knows what a rupture conventionnelle is, or what URSSAF takes.
- A meetup page cannot show what an evening with the group feels like. **(to confirm)**

**What it costs them:** Months of savings and a retour au CDI. In the game: about 59 days.

**Emotional tension:** "Am I the only one with no customers?" The fear of posting numbers that look small. The pull of the cage dorée: €55k, des tickets resto et un baby-foot.

## Competitive Landscape
Taken from their Product Hunt listings. I have not played them, so the "falls short" lines compare positioning, not quality.

**Direct (startup and maker games):**
- San Fran Sim, "A startup tycoon game" (Product Hunt, July 2026, 297 points, #3 of the day). The strongest recent one. Silicon Valley tycoon framing: the opposite fantasy to one person, no VC, a kebab a day.
- Indie Maker The Game, "Open source game about indie makers" (2019, 100 points). Same subject and same licence, seven years old.
- IndieHackers RPG Game (2023, 272 points). A retro RPG with AI-written dialogue: a world to walk around, not a run to win and compare.
- Startup Company (Steam, 2018). A paid sandbox for long sessions: hire, grow, scale.

**Secondary (same lesson, another form):** build-in-public threads on X, indie podcasts and YouTube channels, the Indie Hackers forum, books about bootstrapping. Free and abundant, but you read them, you do not lose €600 of rent to them.

**Indirect (same ten minutes):** the daily browser game habit, and scrolling X. No lesson, no group to join at the end.

## Differentiation
**Key differentiators:**
- **The goal is small on purpose.** €270 of MRR. Not a unicorn, not an exit. A kebab a day.
- **It is French and local.** Rupture conventionnelle, URSSAF at 22%, a welsh at lunch, Le Charlatan. The jargon stays in English, "as it does at the apéro".
- **The people are real.** You play actual members of the group and meet the indie hackers you follow, each with a perk, a flaw and a handle.
- **Everyone plays the same run each day.** Two scores compare decisions, not luck. The server replays every run, so nothing on the board is made up.
- **Every joke carries advice.** Each cameo ends on "Dans la vraie vie": one thing to do this week. Chef's tips are checked against the simulation.
- **There is a real apéro behind it.** On apéro day the game links to the next one on Luma.
- **Chef.** The only profitable entrepreneur in the game sells kebabs. "Vingt ans que ma broche tourne. Rentable depuis le premier jour."

**How we do it differently:** A run is short (a good player wins in about 45 game days, some 200 clicks), free, in the browser, with no account. All art and sound are original and written as code.

**Why that's better:** You get the lesson by losing to it once, in a few minutes, instead of over six months of savings.

**Why people choose it:** They recognise themselves, or someone they know, in it. Then they want to beat that someone.

## Objections
| Objection | Response |
|-----------|----------|
| "I don't have time for a game." | One run is about 45 game days and 200 clicks. No account, no download. The current run is saved in the browser. |
| "It's a Lille in-joke, and I'm not French." | It plays in English too. The intro explains the French bits in one line each, and the cameos are people you already follow. |
| "Funny, but do I learn anything?" | Each cameo gives one piece of advice to use this week. And the game's whole balance says one thing: the run that posts wins, the run that only codes goes broke. |
| "Why pay for a free game?" | You don't have to. After a win it asks once for €9: a real kebab for its author. "Te voilà kebab profitable. Le jeu, pas encore." |
| "I'm in it and I didn't ask to be." | An affectionate parody: jokes, never quotes, and no card makes fun of a real setback. Open an issue and the card is removed. |

**Anti-persona:** Someone who wants a deep tycoon game with hours of progression. Someone on the venture track ("Sans levée de fonds" is the boast here). Someone looking for a course or a method. Someone with no idea what MRR is and no wish to find out.

## Switching Dynamics
Nobody switches tools here: the cost is attention and a little pride.

**Push:** Tired of guru threads and other people's MRR screenshots. A side project with no customers and nobody to tell.
**Pull:** A friend's score to beat. Seeing people you know as 16-bit characters. A laugh of recognition at "Fini le CDI. Finies les réunions. Fini le salaire."
**Habit:** Scrolling X instead. Building instead of posting. "I'll play it later."
**Anxiety:** Posting a game score looks unserious. Losing in public. "Is this making fun of me?"

## Customer Language
**How they describe the problem:** none collected yet. Collect at apéro #50 and from replies to shared scores.

**How they describe us:** none collected yet.

**The group's own words (Luma):**
- "Le repaire lillois pour créer un business web autofinancé et profiter de la vie !"
- "50 apéros à parler code, MRR et side-projects."
- "Exit = Produit × Distribution × Patience"

**Words to use:** kebab profitable, MRR, shipper, poster, pivoter, démarcher, build in public, side-project, apéro, CDI, retour au CDI, rupture conventionnelle, URSSAF, loyer, run, la partie du jour, chef.

**Words to avoid:** "startup simulator" as the headline (it is the shelf, not the pitch), "gamified learning", "course", "masterclass", "passive income", "10x", "disrupt", "unicorn" unless it is the butt of the joke. "Ramen profitable" belongs to the forum: use it only as the thing Chef corrects.

**Glossary:**
| Term | Meaning |
|------|---------|
| Kebab profitable | €270 of MRR: a €9 kebab a day for 30 days. The win condition, and the group's answer to "ramen profitable". |
| Chef | The owner of the kebab shop downstairs. Coach, rival and the only profitable entrepreneur in the game. He calls you "chef" too. |
| Retour au CDI | Losing by running out of cash. |
| La cage dorée | Losing by signing a job offer. |
| La partie du jour / today's run | The daily seeded run everyone plays. |
| Carte urgente | A card with a 6 or 8 second clock: a safe answer or a gamble. |
| Caméo | A card where a known indie hacker turns up, ending with "Dans la vraie vie". |
| Apéro | The monthly meetup. In the game it is at Le Charlatan. The real one moves: #50 is at Le Triplex, so never send people to Le Charlatan. |
| Founder card | The €27 purchase: your own playable card on the roster. |

## Brand Voice
Extracted from copy already in the game, not from adjectives.

| Attribute | Means | Doesn't mean | Example line |
|-----------|-------|--------------|--------------|
| Deadpan | Say the absurd thing flatly and stop. | Exclamation marks, winking, explaining the joke. | "Neuf euros, chef. Chez moi, les clients paient avant de manger." |
| Numbers first | Lead with the figure, then the proof, then the dare. | Vague promises, adjectives doing a number's job. | "44 jours pour être kebab profitable 🥙 / Sans levée de fonds, sans CDI. / Bats-moi 👇" |
| Insider, in franglais | French sentences, English jargon, the way it is spoken at the apéro. | Translating MRR or "ship". Corporate French. | "Code ton MVP, shippe-le, fais grandir ton audience. Si l'idée fait un flop, pivote." |
| Affectionate | Tease the scene and yourself. Everyone named would laugh. | Mocking a real setback, putting words in a real mouth. | "Je ne juge pas. Un peu." |
| A dare, not an ask | End on a challenge. | "Please share", "we'd love your support". | "Fais plus de thune que moi. Si tu peux." |

**Tone by context:**
- Support (someone wants a card or a score removed): plain and immediate, no joke. "Open an issue and the card will be removed."
- Launch: one number, one dare, the link. The film's lines are the model: "YOU SHIPPED IT. NOBODY CAME."
- Errors: say what happened and what to do next, in one breath. "Le classement n'est pas encore ouvert. Ton score reste dans ce navigateur."
- Sales: Chef does the asking, once, and the price is counted in kebabs. "Trois kebabs, une seule fois."
- Social: tutoiement, short lines, 🥙 and 👇 and little else. Thank people by handle.

**Terms we own:** kebab profitable, "un kebab par jour", "Deviens rentable, un kebab à la fois.", Chef, "Rentable depuis le premier jour.", retour au CDI.

**Never use (and why):**
- Anything that reads as endorsed by indiehackers.com or by a person in the game. It is a parody and says so.
- A quote attributed to a real person. The lines are jokes, the advice is the game's.
- Fake or inflated numbers. Every figure in the film has a source (`video/SOURCES.md`); keep it that way.
- "en pixels" after a guest's name. Dropped on 2026-11-17: name them plainly.
- Vouvoiement.

## Proof Points
**Metrics (checked 2026-11-26 unless dated):**
- 7 players on the all-time board. Best run: 36 days, by Karl and by flexbox (the author). One player took 14 attempts at a day's run to get on it.
- Simulation, 400 runs per founder: an expert wins 92 to 99% of runs in a median 41 to 46 days; the sim's newcomer bot wins 25 to 37%.
- Posting or not: 96% against 9% (2026-11-20, see Product Overview).
- 28 people going to apéro #50.
- Content: 5 playable founders, 13 cameos, 30 ideas, 32 events, 18 urgent cards, some 120 lines for Chef.
- GitHub: 0 stars, 0 forks.
- Traffic, 2026-11-17 to 11-26: about 150 visitors and 242 page views. 107 from France. 59 came from X, 84 direct, 4 from LinkedIn, 2 from Luma. 94 on desktop, 55 on a phone.
- Funnel: not readable. The game sends six funnel events (run started, idea picked, MVP shipped, first customer, run ended, tips hidden), but Vercel only shows custom events on a Pro plan.
- Revenue: €0. No kebab and no founder card sold (David, 2026-11-26).

**Customers:** none in the logo sense. The names that carry weight are the cameos, and they have not endorsed anything.

**Testimonials:** none collected yet.

**Value themes:**
| Theme | Proof |
|-------|-------|
| Posting beats coding | Same run, same founder: broke on day 59 without posts, kebab profitable on day 43 with them. |
| It is fair | Same seed for everyone each day; the server replays each run before ranking it. |
| It is real | Real members, a real monthly apéro (50 editions), real French costs. |
| It was shipped the way it preaches | Built in a week, open source, in public, and it asks you for €9. |

## Goals
**Business goal (confirmed by David, 2026-11-26):** Make the game itself kebab profitable, €270 in a month, as the live case for David's talk at apéro #50, "faire du GTM avec des skills IA marketing". Behind it: bring new people to Indie Hackers Lille.

**Dates:**
- Apéro #50, "L'édition des 50 apéros": Tuesday 2026-12-08, 19:00 to 20:30, Le Triplex, 31 rue Doudin, Lille. The game is shown to the room there first.
- Product Hunt launch: Thursday 2026-12-10, two days after the apéro (moved from 2026-12-08 on 2026-11-26). Tagline on the draft: "Quit your job, reach €270 MRR before the cash runs out".
- The plan: `~/marketing-plans/kebab-profitable/plan.md`.

**Conversion actions, in order:**
1. Play today's run.
2. Finish it, put the score on the board, share it on X.
3. Follow the Luma link and come to an apéro.
4. Buy a kebab (€9) or a founder card (€27).

**Current metrics:** see Proof Points. About 15 visitors a day, €0. No baseline yet for runs started, runs finished or shares.

## Paid Ads (optional)
Not used.

## Learnings
*Decisions and tested lessons. Newest first. Keep it to about 20 active entries.*
| Date | Learning | Evidence | Applies to | Status |
|------|----------|----------|------------|--------|
| | | | | |

## Changelog
*Newest first. One line per revision: what changed and why.*
- v3 (2026-11-26) — Product Hunt moved to 2026-12-10; founder card capped at ten seats; kebab offer after a loss decided; cameos to be told by a launch-day thread. All David's decisions.
- v2 (2026-11-26) — Goal confirmed by David; sales set to €0; traffic baseline added from Vercel Analytics; apéro #50 dated 2026-12-08 and the Product Hunt launch placed after it.
- v1 (2026-11-26) — Initial context, drafted from the repo, the live leaderboard, the Luma page and the Product Hunt draft. Not yet reviewed by David.
