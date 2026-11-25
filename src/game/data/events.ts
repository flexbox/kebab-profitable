import type { EventDef, EventOutcome } from "../types";
import { APERO_CARDS } from "./apero";
import { URGENT_CARDS } from "./urgent";

/**
 * The event deck. One card may turn up overnight and is answered in the
 * morning. The urgent cards, answered against the clock in the middle of a
 * day, are in `urgent.ts`, and the cards of the apéro in `apero.ts`: both
 * join the deck at the end of this file.
 *
 * House rules for cameo cards (kind: "cameo"):
 *  - the figure appears by name, never as a quote; the "in real life" advice
 *    under the result is the game's own, see `lesson` in `guests.ts`;
 *  - the joke is about what they are famous for, never about a setback;
 *  - anyone named can ask for their card to be removed (see the README).
 *
 * Adding a card: copy one, give it a new `id`, and describe what happens with
 * `effect`. See `Effect` in src/game/types.ts for everything an effect can do.
 */
export const EVENTS: EventDef[] = [
  // =========================================================================
  // Cameos
  // =========================================================================
  {
    id: "levels-ship",
    kind: "cameo",
    tone: "good",
    who: "levels",
    title: { fr: "Just ship it", en: "Just ship it" },
    text: {
      fr: "Pieter Levels apparaît dans ton fil. Il regarde ta liste de 47 tâches avant lancement et hausse un sourcil. Le message est clair.",
      en: "Pieter Levels shows up in your feed. He looks at your 47-item pre-launch list and raises an eyebrow. The message is clear.",
    },
    when: { hasProject: true, launched: false },
    choices: [
      {
        label: { fr: "Couper dans le MVP", en: "Cut the MVP down" },
        outcomes: [
          {
            effect: { mvpCut: 0.4 },
            text: {
              fr: "Tu supprimes le mode sombre, l'onboarding et trois tableaux de bord. Il reste un produit. Presque.",
              en: "You drop dark mode, onboarding and three dashboards. A product remains. Almost.",
            },
          },
        ],
      },
      {
        label: { fr: "Tout garder", en: "Keep everything" },
        outcomes: [
          {
            effect: { moral: 2 },
            text: {
              fr: "Tu gardes tout. Le mode sombre, ça ne se négocie pas.",
              en: "You keep it all. Dark mode is not up for negotiation.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "marclou-video",
    kind: "cameo",
    tone: "good",
    who: "marc",
    title: { fr: "Vidéo de lancement", en: "Launch video" },
    text: {
      fr: "Marc Lou propose de jouer dans ta vidéo de lancement. Il a déjà le costume, la perruque et un fond vert.",
      en: "Marc Lou offers to star in your launch video. He already has the costume, the wig and a green screen.",
    },
    when: { hasProject: true },
    choices: [
      {
        label: { fr: "Tourner la vidéo", en: "Roll camera" },
        outcomes: [
          {
            effect: { flags: { burstMult: 2 } },
            text: {
              fr: "La vidéo est dans la boîte. Ton prochain lancement fera deux fois plus de bruit.",
              en: "The video is in the can. Your next launch will make twice the noise.",
            },
          },
        ],
      },
      {
        label: { fr: "Trop timide", en: "Too shy" },
        outcomes: [
          {
            effect: { moral: -1 },
            text: {
              fr: "Tu déclines. Ton lancement sera sobre. Très sobre.",
              en: "You decline. Your launch will be understated. Very.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "marclou-boilerplate",
    kind: "cameo",
    tone: "neutral",
    who: "marc",
    title: { fr: "Le boilerplate", en: "The boilerplate" },
    text: {
      fr: "Une pub te suit partout : un boilerplate qui promet de lancer ta startup en quelques jours plutôt qu'en quelques semaines. 199 €.",
      en: "An ad follows you everywhere: a boilerplate that promises to launch your startup in days rather than weeks. €199.",
    },
    when: { hasProject: true, launched: false, minCash: 250 },
    choices: [
      {
        label: { fr: "Acheter (199 €)", en: "Buy it (€199)" },
        outcomes: [
          {
            effect: { cash: -199, mvpCut: 0.5 },
            text: {
              fr: "Auth, paiement, emails : tout est déjà là. La moitié du travail restant vient de disparaître.",
              en: "Auth, payments, emails: all there already. Half the remaining work just vanished.",
            },
          },
        ],
      },
      {
        label: { fr: "Tout coder soi-même", en: "Code it all yourself" },
        outcomes: [
          {
            effect: { moral: 2 },
            text: {
              fr: "Tu refais l'authentification à la main. Par principe.",
              en: "You hand-roll authentication again. On principle.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "tibo-offer",
    kind: "cameo",
    tone: "neutral",
    who: "tibo",
    title: { fr: "Offre de rachat", en: "Acquisition offer" },
    text: {
      fr: "Tibo t'écrit en privé : il rachèterait bien ton projet. Cash tout de suite, douze fois ton MRR.",
      en: "Tibo slides into your DMs: he would happily buy your project. Cash now, twelve times your MRR.",
    },
    when: { launched: true, minMrr: 60 },
    choices: [
      {
        label: { fr: "Vendre", en: "Sell" },
        outcomes: [
          {
            effect: { cashPerMrr: 12, sell: true, moral: 10 },
            text: {
              fr: "Virement reçu. Tu n'as plus de produit, mais tu as du temps et une histoire à raconter.",
              en: "Wire received. You have no product left, but you have time and a story to tell.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser", en: "Refuse" },
        outcomes: [
          {
            effect: { moral: 4 },
            text: {
              fr: "Tu gardes ton bébé. Et ton MRR.",
              en: "You keep your baby. And your MRR.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "dagobert-suit",
    kind: "cameo",
    tone: "neutral",
    who: "dago",
    title: { fr: "Le costume à logos", en: "The logo suit" },
    text: {
      fr: "Dagobert Renouf, voisin lillois, vend des emplacements pour logos sur son costume de mariage. Il reste une place sur la manche gauche.",
      en: "Dagobert Renouf, a fellow Lillois, is selling logo spots on his wedding suit. One place is left on the left sleeve.",
    },
    when: { minCash: 300 },
    choices: [
      {
        label: { fr: "Prendre la manche (120 €)", en: "Take the sleeve (€120)" },
        outcomes: [
          {
            effect: { cash: -120, audience: 60, audiencePct: 0.15 },
            text: {
              fr: "Ton logo est sur les photos du mariage. Tout Internet a vu la manche gauche.",
              en: "Your logo is in the wedding photos. The whole internet saw the left sleeve.",
            },
          },
        ],
      },
      {
        label: { fr: "Passer son tour", en: "Pass" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tu gardes tes 120 €. La manche part à un concurrent.",
              en: "You keep your €120. The sleeve goes to a competitor.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "nico-17apps",
    kind: "cameo",
    tone: "good",
    who: "nico",
    title: { fr: "17 apps", en: "17 apps" },
    text: {
      fr: "Tu tombes sur l'histoire de Nico Jeannen : dix-sept apps lancées en un an. Tu regardes ton unique projet d'un autre œil.",
      en: "You come across Nico Jeannen's story: seventeen apps shipped in a year. You look at your one project differently.",
    },
    choices: [
      {
        label: { fr: "C'est noté", en: "Noted" },
        outcomes: [
          {
            effect: { flags: { freePivot: true } },
            text: {
              fr: "Si un jour tu pivotes, ce sera sans y laisser ta journée.",
              en: "If you ever pivot, it won't cost you the day.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "sanlis-uneed",
    kind: "cameo",
    tone: "good",
    who: "thomas",
    title: { fr: "Lancement sur Uneed", en: "Launch on Uneed" },
    text: {
      fr: "Thomas Sanlis t'ouvre un créneau sur Uneed, l'alternative à Product Hunt. Un deuxième lancement, ça ne se refuse pas.",
      en: "Thomas Sanlis opens a slot for you on Uneed, the Product Hunt alternative. You don't turn down a second launch.",
    },
    when: { launched: true },
    choices: [
      {
        label: { fr: "Lancer", en: "Launch" },
        outcomes: [
          {
            effect: { burst: 0.8 },
            text: {
              fr: "Nouveau public, nouvelles inscriptions.",
              en: "New crowd, new signups.",
            },
          },
        ],
      },
      {
        label: { fr: "Plus tard", en: "Later" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tu gardes ça sous le coude. Le créneau, lui, ne t'attend pas.",
              en: "You keep it up your sleeve. The slot does not wait for you.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "tony-numbers",
    kind: "cameo",
    tone: "neutral",
    who: "tony",
    title: { fr: "Les chiffres du mois", en: "Monthly numbers" },
    text: {
      fr: "Tony Dinh publie ses chiffres du mois, comme chaque mois. Tu ouvres ton tableau de bord Stripe et tu hésites à faire pareil.",
      en: "Tony Dinh posts his monthly numbers, as he does every month. You open your Stripe dashboard and wonder whether to do the same.",
    },
    when: { launched: true },
    choices: [
      {
        label: { fr: "Publier les tiens", en: "Post yours" },
        outcomes: [
          {
            when: { mrrGrew: true },
            effect: { audience: 20, audiencePct: 0.2, moral: 5 },
            text: {
              fr: "Ça monte, et ça se voit. Tout le monde aime une courbe qui grimpe.",
              en: "It's going up, and it shows. Everybody loves a rising line.",
            },
          },
          {
            when: { mrrGrew: false },
            effect: { audience: 5, moral: -8 },
            text: {
              fr: "Ta courbe est plate. Deux likes, dont ta mère.",
              en: "Your line is flat. Two likes, one from your mum.",
            },
          },
        ],
      },
      {
        label: { fr: "Garder ça pour toi", en: "Keep it to yourself" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tes chiffres restent entre Stripe et toi.",
              en: "Your numbers stay between you and Stripe.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "postma-headshot",
    kind: "cameo",
    tone: "good",
    who: "danny",
    title: { fr: "Photo de profil IA", en: "AI profile photo" },
    text: {
      fr: "Danny Postma a bâti un business sur les portraits générés par IA. Ta photo de profil, elle, date d'un mariage en 2019.",
      en: "Danny Postma built a business on AI-generated headshots. Your own profile photo dates from a wedding in 2019.",
    },
    when: { minCash: 100 },
    choices: [
      {
        label: { fr: "S'offrir un portrait (29 €)", en: "Get a headshot (€29)" },
        outcomes: [
          {
            effect: { cash: -29, audience: 35 },
            text: {
              fr: "Tu as l'air d'un fondateur qui vient de lever des fonds. Les abonnés affluent.",
              en: "You look like a founder who just raised a round. Followers pour in.",
            },
          },
        ],
      },
      {
        label: { fr: "Garder la photo du mariage", en: "Keep the wedding photo" },
        outcomes: [
          {
            effect: { moral: 1 },
            text: {
              fr: "Authentique. Floue, mais authentique.",
              en: "Authentic. Blurry, but authentic.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "arvid-cloned",
    kind: "cameo",
    tone: "bad",
    who: "arvid",
    title: { fr: "Cloné !", en: "Cloned!" },
    text: {
      fr: "À force de tout raconter en public, quelqu'un a copié ton produit, jusqu'à la faute de frappe sur le bouton. Arvid Kahl avait prévenu que ça arrivait.",
      en: "After all that building in public, someone copied your product, down to the typo on the button. Arvid Kahl did warn that this happens.",
    },
    when: { launched: true, minAudience: 150 },
    choices: [
      {
        label: { fr: "Shipper plus vite qu'eux", en: "Out-ship them" },
        outcomes: [
          {
            effect: { boost: { mult: 0.6, days: 6 }, moral: -4 },
            text: {
              fr: "Tu serres les dents. Les inscriptions ralentissent pendant quelques jours.",
              en: "You grit your teeth. Signups slow down for a few days.",
            },
          },
        ],
      },
      {
        label: { fr: "Écrire un thread indigné", en: "Post an outraged thread" },
        outcomes: [
          {
            p: 0.5,
            effect: { boost: { mult: 0.6, days: 6 }, audience: 50 },
            text: {
              fr: "Le thread fait le tour de X. Le clone est toujours là, mais toi aussi.",
              en: "The thread does the rounds on X. The clone is still there, but so are you.",
            },
          },
          {
            p: 0.5,
            effect: { boost: { mult: 0.6, days: 6 }, moral: -9 },
            text: {
              fr: "Personne ne réagit. Le clone, lui, vient de sortir une v2.",
              en: "Nobody reacts. The clone, meanwhile, just shipped a v2.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "flavie-podcast",
    kind: "cameo",
    tone: "good",
    who: "flavie",
    title: { fr: "Un micro pour toi", en: "A microphone for you" },
    text: {
      fr: "Flavie Prévot t'invite dans son podcast, Le Board, pour raconter comment on vit d'un SaaS en solo. Tu n'en vis pas encore, mais personne n'a posé la question.",
      en: "Flavie Prévot invites you on her podcast, Le Board, to tell how one lives off a SaaS alone. You do not yet, but nobody asked.",
    },
    when: { hasProject: true },
    choices: [
      {
        label: { fr: "Enregistrer l'épisode", en: "Record the episode" },
        outcomes: [
          {
            effect: { audience: 35, audiencePct: 0.12, moral: 5, skipSlots: 1 },
            text: {
              fr: "Une heure au micro, un créneau en moins. Des freelances t'écrivent : « et sinon, tu prends des missions ? »",
              en: "An hour at the microphone, one slot gone. Freelancers write to you: “so, do you take on gigs?”",
            },
          },
        ],
      },
      {
        label: { fr: "Demander un conseil, hors micro", en: "Ask for advice, off air" },
        outcomes: [
          {
            effect: { moral: 8 },
            text: {
              fr: "Elle te dit de vendre avant de construire. Tu notes, tu remercies, et tu retournes construire.",
              en: "She tells you to sell before you build. You write it down, say thanks, and go back to building.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "benjamin-films",
    kind: "cameo",
    tone: "good",
    who: "benjamin",
    title: { fr: "Il filme ton build", en: "He films your build" },
    text: {
      fr: "Benjamin Code prépare une vidéo sur les SaaS faits maison et voudrait filmer une de tes sessions de code.",
      en: "Benjamin Code is making a video about homemade SaaS and would like to film one of your coding sessions.",
    },
    when: { hasProject: true },
    choices: [
      {
        label: { fr: "Accepter le tournage", en: "Say yes to the shoot" },
        outcomes: [
          {
            effect: { audience: 40, audiencePct: 0.15, skipSlots: 1 },
            text: {
              fr: "Un créneau de tournage, et des milliers de gens ont vu ton éditeur de code.",
              en: "One slot of filming, and thousands of people have seen your code editor.",
            },
          },
        ],
      },
      {
        label: { fr: "Pas présentable", en: "Not presentable" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tu refuses. Ton code n'est pas prêt à être vu.",
              en: "You decline. Your code is not ready to be seen.",
            },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // French admin
  // =========================================================================
  {
    id: "urssaf-letter",
    kind: "admin",
    tone: "bad",
    title: { fr: "Courrier de l'URSSAF", en: "A letter from URSSAF" },
    text: {
      fr: "Une enveloppe à fenêtre. Régularisation de cotisations : 90 €. Le courrier fait quatre pages et aucune n'explique pourquoi.",
      en: "A window envelope. Contribution adjustment: €90. The letter runs to four pages and none of them says why.",
    },
    when: { minDay: 20 },
    choices: [
      {
        label: { fr: "Payer (90 €)", en: "Pay (€90)" },
        outcomes: [
          {
            effect: { cash: -90, moral: -2 },
            text: {
              fr: "Tu paies. On ne discute pas avec une enveloppe à fenêtre.",
              en: "You pay. You don't argue with a window envelope.",
            },
          },
        ],
      },
      {
        label: { fr: "Contester", en: "Contest it" },
        outcomes: [
          {
            p: 0.5,
            effect: { skipSlots: 2, moral: 6 },
            text: {
              fr: "Deux créneaux au téléphone, et l'erreur venait de chez eux. Rare et délicieux.",
              en: "Two slots on the phone, and the mistake was theirs. Rare and delicious.",
            },
          },
          {
            p: 0.5,
            effect: { skipSlots: 2, cash: -110, moral: -5 },
            text: {
              fr: "Deux créneaux au téléphone, et une majoration en prime : 110 €.",
              en: "Two slots on the phone, and a late fee on top: €110.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "france-travail",
    kind: "admin",
    tone: "neutral",
    title: { fr: "Rendez-vous France Travail", en: "France Travail appointment" },
    text: {
      fr: "Convocation ce matin : atelier « Valoriser son profil ». Présence obligatoire.",
      en: "A summons for this morning: a workshop called “Making the most of your profile”. Attendance mandatory.",
    },
    when: { minDay: 6 },
    choices: [
      {
        label: { fr: "Y aller", en: "Go" },
        outcomes: [
          {
            effect: { skipSlots: 1, moral: -3 },
            text: {
              fr: "Tu apprends à rédiger un CV. Tu en as écrit douze dans ta vie.",
              en: "You learn how to write a CV. You have written twelve in your life.",
            },
          },
        ],
      },
      {
        label: { fr: "Sécher", en: "Skip it" },
        outcomes: [
          {
            p: 0.6,
            effect: {},
            text: {
              fr: "Personne n'a remarqué ton absence.",
              en: "Nobody noticed you were missing.",
            },
          },
          {
            p: 0.4,
            effect: { skipSlots: 3, moral: -6 },
            text: {
              fr: "Convocation de rattrapage : tu y passes la journée entière.",
              en: "A make-up summons: you spend the whole day there.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "stripe-hold",
    kind: "admin",
    tone: "bad",
    title: { fr: "Compte Stripe en revue", en: "Stripe account under review" },
    text: {
      fr: "Stripe veut vérifier ton activité. En attendant, les versements sont suspendus.",
      en: "Stripe wants to check your business. Until then, payouts are on hold.",
    },
    when: { launched: true, minMrr: 30 },
    choices: [
      {
        label: { fr: "Envoyer les justificatifs", en: "Send the paperwork" },
        outcomes: [
          {
            effect: { skipSlots: 1 },
            text: {
              fr: "Pièce d'identité, avis de situation, facture d'électricité. Un créneau plus tard, le compte est débloqué.",
              en: "ID, company registration, electricity bill. One slot later, the account is unlocked.",
            },
          },
        ],
      },
      {
        label: { fr: "Attendre que ça passe", en: "Wait it out" },
        outcomes: [
          {
            effect: { flags: { payoutHold: true } },
            text: {
              fr: "Le versement de ce mois arrivera avec celui du mois prochain.",
              en: "This month's payout will arrive with next month's.",
            },
          },
        ],
      },
    ],
  },
  // A catastrophe of paper: the URSSAF login lives on a sheet somewhere in
  // the flat. Found, it costs nothing but an alert; lost, it costs the day.
  {
    id: "urssaf-login",
    kind: "admin",
    tone: "bad",
    title: { fr: "Connexion à l'URSSAF", en: "Logging in to URSSAF" },
    text: {
      fr: "Il faut te connecter à ton espace URSSAF ce matin. Ton identifiant et ton mot de passe sont sur une feuille de papier. Quelque part.",
      en: "You have to log in to your URSSAF account this morning. Your username and password are on a sheet of paper. Somewhere.",
    },
    when: { hasProject: true, minDay: 5 },
    choices: [
      {
        label: { fr: "Chercher la feuille", en: "Look for the sheet" },
        outcomes: [
          {
            p: 0.5,
            effect: { moral: -1 },
            text: {
              fr: "Elle était sous le clavier. Tu te connectes, et l'URSSAF t'envoie aussitôt une alerte : « Nouvelle connexion détectée sur votre espace ». C'était toi.",
              en: "It was under the keyboard. You log in, and URSSAF sends you an alert at once: “New sign-in detected on your account”. It was you.",
            },
          },
          {
            p: 0.5,
            effect: { skipSlots: 3, moral: -8 },
            text: {
              fr: "Tu vides trois classeurs, deux cartons et la boîte à chaussures des « papiers importants ». Tu retrouves ton diplôme de natation. Pas la feuille. La journée y est passée.",
              en: "You empty three binders, two boxes and the shoebox of “important papers”. You find your swimming certificate. Not the sheet. The whole day is gone.",
            },
          },
        ],
      },
      {
        label: { fr: "Appeler l'URSSAF", en: "Call URSSAF" },
        outcomes: [
          {
            effect: { skipSlots: 2, moral: -4 },
            text: {
              fr: "Quarante minutes de musique d'attente, un code reçu par courrier « sous cinq jours ouvrés », et finalement un conseiller qui te reconnecte. Ta matinée et ton après-midi y sont passés.",
              en: "Forty minutes of hold music, a code sent by post “within five working days”, and at last an adviser who gets you back in. Your morning and afternoon are gone.",
            },
          },
        ],
      },
    ],
  },
  // A catastrophe: either answer costs dearly. It goes after those who have
  // something to take: a product that earns, and money in the bank. Measured
  // with `pnpm sim`, it costs a first-timer five to eight points of win rate;
  // dealt to anyone with a launched product, it cost ten to fifteen.
  {
    id: "logo-troll",
    kind: "admin",
    tone: "bad",
    title: { fr: "Mise en demeure", en: "Cease and desist" },
    text: {
      fr: "Un cabinet d'avocats t'écrit : ton logo copierait celui de leur client. Leur client n'a pas de produit, pas de site, pas un seul utilisateur. Il a une marque déposée et onze avocats.",
      en: "A law firm writes to you: your logo is said to copy their client's. Their client has no product, no website, not a single user. It has a registered trademark and eleven lawyers.",
    },
    when: { launched: true, minMrr: 60, minCash: 700 },
    choices: [
      {
        label: { fr: "Repartir de zéro", en: "Start again from zero" },
        outcomes: [
          {
            effect: { reboot: true, moral: -14 },
            text: {
              fr: "Tu retires tout : le nom, le logo, le domaine, l'appli. Le produit repart de zéro, et tes clients ne te retrouvent pas. Eux gardent un logo dont ils ne font rien.",
              en: "You take it all down: the name, the logo, the domain, the app. The product starts again from zero, and your customers cannot find you. They keep a logo they do nothing with.",
            },
          },
        ],
      },
      {
        label: { fr: "Racheter la marque (450 €)", en: "Buy the trademark (€450)" },
        when: { minCash: 450 },
        outcomes: [
          {
            effect: { cash: -450, moral: -5 },
            text: {
              fr: "Tu rachètes la marque. Te voilà propriétaire d'un logo que tu avais déjà, et de la facture de leurs onze avocats.",
              en: "You buy the trademark. You now own a logo you already had, and the bill for their eleven lawyers.",
            },
          },
        ],
      },
    ],
  },
  // A catastrophe of the administration: URSSAF strikes the founder off by
  // mistake and opens them again at the same address, so the whole year's
  // adjustment falls due at once. Letting it go costs the most money; calling
  // costs the day, and a struck-off founder may not be allowed to pay in parts.
  // Measured with `pnpm sim`, it costs a first-timer four to eight points of
  // win rate, like the cease and desist.
  {
    id: "urssaf-struck-off",
    kind: "admin",
    tone: "bad",
    title: { fr: "Radié par l'URSSAF", en: "Struck off by URSSAF" },
    text: {
      fr: "Tu n'as pas bougé d'un mètre cette année. L'URSSAF a quand même réussi à te radier, pour te rouvrir dans la foulée au même endroit. Toute ta régularisation est à payer d'un coup : 420 € avant le 15. Le prélèvement est déjà lancé.",
      en: "You haven't moved an inch this year. URSSAF still managed to strike you off, then open you again at the same address. Your whole adjustment is due at once: €420 before the 15th. The direct debit has already gone out.",
    },
    when: { launched: true, minMrr: 40, minCash: 500, minDay: 30 },
    choices: [
      {
        label: { fr: "Laisser passer le prélèvement (420 €)", en: "Let the debit go through (€420)" },
        outcomes: [
          {
            effect: { cash: -420, moral: -6 },
            text: {
              fr: "Le prélèvement passe. Tu finances la santé et la retraite, et en prime le travail mal fait de quelqu'un d'autre.",
              en: "The debit goes through. You pay for healthcare and pensions, and for someone else's botched work on top.",
            },
          },
        ],
      },
      {
        label: { fr: "Appeler l'URSSAF", en: "Call URSSAF" },
        outcomes: [
          {
            p: 0.4,
            effect: { skipSlots: 2, cash: -150, moral: -3 },
            text: {
              fr: "La conseillère vérifie : « Ah bah oui, vous avez raison. Mais qu'est-ce qu'ils ont fait ? » Tu fais toi-même opposition au prélèvement, et un gestionnaire t'accorde un étalement. 150 € ce mois-ci.",
              en: "The adviser checks: “Oh, yes, you're right. But what have they done?” You stop the debit yourself, and a case manager lets you pay in parts. €150 this month.",
            },
          },
          {
            p: 0.6,
            effect: { skipSlots: 2, cash: -480, moral: -10 },
            text: {
              fr: "« C'est normal, c'est le temps que ce soit pris en compte. » Un radié n'a pas le droit d'étaler. Tu paies les 420 €, plus 60 € de pénalités de retard pour une erreur qui n'est pas la tienne.",
              en: "“That's normal, it takes time to be taken into account.” A struck-off founder may not pay in parts. You pay the €420, plus €60 in late fees for a mistake that isn't yours.",
            },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Clichés of the scene
  // =========================================================================
  {
    id: "ph-launch",
    kind: "scene",
    tone: "neutral",
    title: { fr: "Jour de lancement Product Hunt", en: "Product Hunt launch day" },
    text: {
      fr: "Il est 9 h 01 à Lille, minuit une à San Francisco. C'est le moment ou jamais de lancer sur Product Hunt.",
      en: "It is 9:01 in Lille, one minute past midnight in San Francisco. Now or never for a Product Hunt launch.",
    },
    when: { launched: true },
    choices: [
      {
        label: { fr: "Y passer la journée", en: "Spend the day on it" },
        outcomes: [
          {
            p: 0.25,
            effect: { skipSlots: 3, burst: 3, moral: 12 },
            text: {
              fr: "Produit du jour ! Tu as supplié tout ton carnet d'adresses, et ça a payé.",
              en: "Product of the day! You begged your entire address book, and it paid off.",
            },
          },
          {
            p: 0.5,
            effect: { skipSlots: 3, burst: 1.2 },
            text: {
              fr: "Huitième du jour. Honorable, avec quelques inscriptions à la clé.",
              en: "Eighth of the day. Respectable, with a few signups to show for it.",
            },
          },
          {
            p: 0.25,
            effect: { skipSlots: 3, burst: 0.3, moral: -8 },
            text: {
              fr: "Noyé sous douze outils d'IA lancés le même jour.",
              en: "Buried under twelve AI tools launched the same day.",
            },
          },
        ],
      },
      {
        label: { fr: "Pas aujourd'hui", en: "Not today" },
        outcomes: [
          {
            effect: {},
            text: { fr: "Tu gardes ta journée.", en: "You keep your day." },
          },
        ],
      },
    ],
  },
  {
    id: "appstore-reject",
    kind: "scene",
    tone: "bad",
    title: { fr: "Rejet de l'App Store", en: "App Store rejection" },
    text: {
      fr: "Ton app est refusée : elle « ressemble à d'autres apps ». Le message n'en dit pas plus.",
      en: "Your app is rejected: it “resembles other apps”. The message says nothing more.",
    },
    when: { mobile: true, launched: false, minBuilt: 0.5 },
    choices: [
      {
        label: { fr: "Corriger et renvoyer", en: "Fix and resubmit" },
        outcomes: [
          {
            effect: { mvpAdd: 10 },
            text: {
              fr: "Tu ajoutes un écran pour avoir l'air différent. Un peu de travail en plus.",
              en: "You add a screen to look different. A little more work.",
            },
          },
        ],
      },
      {
        label: { fr: "Faire appel", en: "Appeal" },
        outcomes: [
          {
            p: 0.4,
            effect: {},
            text: {
              fr: "Appel accepté. Personne ne sait pourquoi.",
              en: "Appeal granted. Nobody knows why.",
            },
          },
          {
            p: 0.6,
            effect: { skipSlots: 2, moral: -4 },
            text: {
              fr: "Appel rejeté, après deux créneaux d'attente.",
              en: "Appeal denied, after two slots of waiting.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "refund",
    kind: "scene",
    tone: "bad",
    title: { fr: "Demande de remboursement", en: "Refund request" },
    text: {
      fr: "Un client veut être remboursé : il pensait que c'était gratuit.",
      en: "A customer wants a refund: he thought it was free.",
    },
    when: { launched: true, minCustomers: 3 },
    choices: [
      {
        label: { fr: "Rembourser", en: "Refund him" },
        outcomes: [
          {
            effect: { customers: -1, moral: -2 },
            text: {
              fr: "Remboursé, avec un mot gentil.",
              en: "Refunded, with a kind note.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser", en: "Refuse" },
        outcomes: [
          {
            p: 0.5,
            effect: {},
            text: { fr: "Il n'insiste pas.", en: "He lets it go." },
          },
          {
            p: 0.5,
            effect: { customers: -1, audience: -15, moral: -5 },
            text: {
              fr: "Il écrit un thread. Le thread marche mieux que tes posts.",
              en: "He writes a thread. The thread does better than your posts.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "viral-post",
    kind: "scene",
    tone: "good",
    title: { fr: "Post viral", en: "Viral post" },
    text: {
      fr: "Le post que tu as écrit en trente secondes dans la file du kebab fait le tour d'Internet.",
      en: "The post you wrote in thirty seconds in the kebab queue is doing the rounds of the internet.",
    },
    when: { minAudience: 30 },
    choices: [
      {
        label: { fr: "Surfer sur la vague", en: "Ride the wave" },
        outcomes: [
          {
            effect: { audience: 60, audiencePct: 0.5, moral: 10 },
            text: {
              fr: "Des centaines de nouveaux abonnés. Aucun ne sait encore ce que tu vends.",
              en: "Hundreds of new followers. None of them knows what you sell yet.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "ltd",
    kind: "scene",
    tone: "neutral",
    title: { fr: "La tentation du lifetime deal", en: "The lifetime deal temptation" },
    text: {
      fr: "Une plateforme de bons plans te propose une offre à vie : beaucoup d'argent tout de suite, plus rien ensuite.",
      en: "A deals platform offers to run a lifetime deal: a lot of money now, nothing ever after.",
    },
    when: { launched: true },
    choices: [
      {
        label: { fr: "Accepter (+350 €)", en: "Accept (+€350)" },
        outcomes: [
          {
            effect: { cash: 350, boost: { mult: 0.5, days: 14 }, moral: 2 },
            text: {
              fr: "350 € tombent. Pendant deux semaines, plus personne ne veut payer au mois.",
              en: "€350 lands. For two weeks, nobody wants to pay monthly.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser", en: "Refuse" },
        outcomes: [
          {
            effect: { moral: 3 },
            text: { fr: "Le MRR, c'est sacré.", en: "MRR is sacred." },
          },
        ],
      },
    ],
  },
  {
    id: "recruiter-cdi",
    kind: "scene",
    tone: "neutral",
    title: { fr: "Un recruteur sur LinkedIn", en: "A recruiter on LinkedIn" },
    text: {
      fr: "Ton profil a « retenu toute son attention ». CDI, 55 k€, tickets resto, baby-foot. Début lundi.",
      en: "Your profile “caught his full attention”. Permanent contract, €55k, meal vouchers, table football. Start Monday.",
    },
    when: { minDay: 25 },
    choices: [
      {
        label: { fr: "Refuser poliment", en: "Decline politely" },
        outcomes: [
          {
            effect: { moral: 6 },
            text: {
              fr: "Tu refuses. Tu te sens libre, et un peu inconscient.",
              en: "You decline. You feel free, and slightly reckless.",
            },
          },
        ],
      },
      {
        label: { fr: "Négocier une mission courte (+220 €)", en: "Negotiate a short gig (+€220)" },
        outcomes: [
          {
            effect: { cash: 220, skipSlots: 3, moral: -5 },
            text: {
              fr: "Une journée de mission facturée. Le baby-foot était cassé.",
              en: "One day of billed work. The table football was broken.",
            },
          },
        ],
      },
      {
        label: { fr: "Signer le CDI", en: "Sign the contract" },
        outcomes: [
          {
            effect: { end: "cdi" },
            text: { fr: "Tu signes.", en: "You sign." },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Lille life
  // =========================================================================
  {
    id: "drache",
    kind: "lille",
    tone: "neutral",
    repeatable: true,
    title: { fr: "La drache", en: "La drache" },
    text: {
      fr: "Il pleut sur Lille comme si quelqu'un avait oublié de fermer le robinet. Dehors, plus personne.",
      en: "It is raining on Lille as if someone left the tap running. Nobody is outside.",
    },
    choices: [
      {
        label: { fr: "Rester au chaud", en: "Stay in" },
        outcomes: [
          {
            effect: { energie: 8, moral: -3 },
            text: {
              fr: "Plaid, thé, écran. La ville attendra.",
              en: "Blanket, tea, screen. The city can wait.",
            },
          },
        ],
      },
      {
        label: { fr: "Sortir quand même", en: "Go out anyway" },
        outcomes: [
          {
            effect: { moral: 5, energie: -8 },
            text: {
              fr: "Trempé jusqu'aux os, mais tu as croisé un être humain.",
              en: "Soaked to the bone, but you met a human being.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "braderie",
    kind: "lille",
    tone: "good",
    title: { fr: "La Braderie", en: "La Braderie" },
    text: {
      fr: "Premier week-end de septembre : Lille n'est plus qu'un immense vide-grenier qui sent les moules-frites.",
      en: "First weekend of September: Lille turns into one giant flea market that smells of moules-frites.",
    },
    when: { minDay: 247, maxDay: 249 },
    choices: [
      {
        label: { fr: "Y aller", en: "Go" },
        outcomes: [
          {
            effect: { cash: -25, moral: 25, faim: 60, skipSlots: 3 },
            text: {
              fr: "Tu rentres avec un tourne-disque, deux vinyles et l'odeur des frites.",
              en: "You come home with a record player, two records and the smell of fries.",
            },
          },
        ],
      },
      {
        label: { fr: "Travailler", en: "Work" },
        outcomes: [
          {
            effect: { moral: -5 },
            text: {
              fr: "Deux millions de visiteurs dehors. Toi, dedans.",
              en: "Two million visitors outside. You, inside.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "metro",
    kind: "lille",
    tone: "bad",
    title: { fr: "Métro en panne", en: "Metro breakdown" },
    text: {
      fr: "Le métro sans conducteur est aussi sans mouvement. Ton rendez-vous est à l'autre bout de la ville.",
      en: "The driverless metro is also motionless. Your meeting is on the other side of town.",
    },
    choices: [
      {
        label: { fr: "Attendre sur le quai", en: "Wait on the platform" },
        outcomes: [
          {
            effect: { skipSlots: 1 },
            text: {
              fr: "Tu attends. Un créneau s'envole.",
              en: "You wait. A slot flies by.",
            },
          },
        ],
      },
      {
        label: { fr: "Y aller à pied", en: "Walk there" },
        outcomes: [
          {
            effect: { energie: -12, moral: 3 },
            text: {
              fr: "Quarante minutes de marche. Tu arrives à l'heure, et en nage.",
              en: "A forty-minute walk. You arrive on time, and sweating.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "devlille-cfp",
    kind: "lille",
    tone: "neutral",
    title: { fr: "Appel à conférenciers de DevLille", en: "DevLille call for speakers" },
    text: {
      fr: "DevLille cherche des conférenciers. Tu pourrais y raconter ton aventure, à condition d'en avoir une à raconter.",
      en: "DevLille is looking for speakers. You could tell your story there, provided you have one to tell.",
    },
    choices: [
      {
        label: { fr: "Préparer une proposition", en: "Write a proposal" },
        outcomes: [
          {
            effect: { skipSlots: 2, audience: 55 },
            text: {
              fr: "Deux créneaux de slides. Ta proposition circule, et ton nom avec.",
              en: "Two slots of slides. Your proposal circulates, and so does your name.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester concentré", en: "Stay focused" },
        outcomes: [
          {
            effect: { moral: 1 },
            text: { fr: "Les slides attendront.", en: "The slides can wait." },
          },
        ],
      },
    ],
  },
  {
    id: "euratech",
    kind: "lille",
    tone: "good",
    title: { fr: "Une journée à EuraTechnologies", en: "A day at EuraTechnologies" },
    text: {
      fr: "Un pote t'invite à travailler une journée à EuraTechnologies, dans l'ancienne filature. Il y a du café, et des gens qui lèvent des fonds.",
      en: "A friend invites you to work for a day at EuraTechnologies, in the old spinning mill. There is coffee, and people raising money.",
    },
    choices: [
      {
        label: { fr: "Y aller", en: "Go" },
        outcomes: [
          {
            p: 0.7,
            effect: { audience: 20, moral: 6 },
            text: {
              fr: "Tu repars avec des cartes de visite et une envie de lever des fonds, vite passée.",
              en: "You leave with business cards and an urge to raise money that soon passes.",
            },
          },
          {
            p: 0.3,
            when: { launched: true },
            effect: { audience: 20, moral: 8, customers: 1 },
            text: {
              fr: "Ton voisin de bureau s'abonne à ton produit entre deux cafés.",
              en: "The person at the next desk subscribes to your product between two coffees.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester chez toi", en: "Stay home" },
        outcomes: [
          {
            effect: { energie: 5 },
            text: {
              fr: "Ton canapé est aussi un espace de coworking.",
              en: "Your sofa is also a coworking space.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "retreat-creuse",
    kind: "lille",
    tone: "good",
    title: { fr: "La retreat dans la Creuse", en: "The retreat in the Creuse" },
    text: {
      fr: "Le groupe part en retreat : camping dans la Creuse, feu de camp et zéro réseau. Deux jours sans écran.",
      en: "The group is off on retreat: camping in the Creuse, a campfire and no signal. Two days without a screen.",
    },
    when: { minDay: 30, minCash: 200 },
    choices: [
      {
        label: { fr: "Partir (120 €)", en: "Go (€120)" },
        outcomes: [
          {
            effect: {
              cash: -120,
              awayDays: 2,
              socialMoral: 30,
              energie: 25,
              audience: 25,
            },
            text: {
              fr: "Deux jours de feu de camp. Tu reviens avec des idées, des piqûres de moustique et le moral au plus haut.",
              en: "Two days around a campfire. You come back with ideas, mosquito bites and your spirits sky-high.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester travailler", en: "Stay and work" },
        outcomes: [
          {
            effect: { moral: -6 },
            text: {
              fr: "Tu regardes leurs photos depuis ton bureau.",
              en: "You look at their photos from your desk.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "wazemmes",
    kind: "lille",
    tone: "good",
    title: { fr: "Marché de Wazemmes", en: "Wazemmes market" },
    text: {
      fr: "Jour de marché à Wazemmes : des légumes, du poulet rôti et la moitié de Lille.",
      en: "Market day at Wazemmes: vegetables, roast chicken and half of Lille.",
    },
    when: { minCash: 20 },
    choices: [
      {
        label: { fr: "Faire le plein (12 €)", en: "Stock up (€12)" },
        outcomes: [
          {
            effect: { cash: -12, faim: 45, moral: 6 },
            text: {
              fr: "Tu repars avec de quoi tenir trois jours, et un poulet rôti.",
              en: "You leave with enough for three days, and a roast chicken.",
            },
          },
        ],
      },
      {
        label: { fr: "Pas le temps", en: "No time" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Les pâtes au beurre feront l'affaire.",
              en: "Buttered pasta will do.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "carnaval",
    kind: "lille",
    tone: "good",
    title: { fr: "Carnaval de Dunkerque", en: "Dunkirk carnival" },
    text: {
      fr: "Tes potes t'embarquent au carnaval de Dunkerque. Il faut un déguisement, un parapluie et de la voix.",
      en: "Your friends are dragging you to the Dunkirk carnival. You need a costume, an umbrella and a voice.",
    },
    when: { minDay: 32, maxDay: 75, minCash: 60 },
    choices: [
      {
        label: { fr: "Y aller (40 €)", en: "Go (€40)" },
        outcomes: [
          {
            effect: { cash: -40, skipSlots: 3, moral: 28, energie: -15 },
            text: {
              fr: "Tu as attrapé un hareng au vol et perdu ta voix.",
              en: "You caught a flying herring and lost your voice.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester sage", en: "Behave" },
        outcomes: [
          {
            effect: { moral: -4 },
            text: {
              fr: "Tu entends les chants dans les stories des autres.",
              en: "You hear the songs through everyone else's stories.",
            },
          },
        ],
      },
    ],
  },
  ...URGENT_CARDS,
  ...APERO_CARDS,
];

export function eventCard(id: string): EventDef {
  const found = EVENTS.find((e) => e.id === id);
  if (!found) throw new Error(`Unknown event: ${id}`);
  return found;
}

/** Everything a card can lead to, whichever way it is answered. */
export function outcomesOf(e: EventDef): EventOutcome[] {
  return [...e.choices.flatMap((c) => c.outcomes), ...(e.urgent?.missed ?? [])];
}

/** Cards dealt by another card (see `then`): they are never drawn from the deck. */
export const FOLLOW_UPS: ReadonlySet<string> = new Set(
  EVENTS.flatMap(outcomesOf).flatMap((o) => (o.then ? [o.then] : [])),
);
