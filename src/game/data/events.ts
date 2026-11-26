import type { EventDef, EventOutcome, L } from "../types";
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
// The voice bot really is answered eleven times: each answer deals the next
// card at once (see `then`), with a way out on every one, and the eleventh
// asks for a rating from 1 to 5. Only then does a human pick up.
const VOICEBOT_LINES: L[] = [
  { fr: "« J'ai une question sur ma déclaration. »", en: "“I have a question about my declaration.”" },
  { fr: "« Une question. Sur ma déclaration. »", en: "“A question. About my declaration.”" },
  { fr: "« Déclaration. »", en: "“Declaration.”" },
  { fr: "« DÉ-CLA-RA-TION. »", en: "“DEC-LA-RA-TION.”" },
  { fr: "« Déclaration de chiffre d'affaires mensuelle. »", en: "“Monthly revenue declaration.”" },
  { fr: "« Micro-entreprise. »", en: "“Sole trader.”" },
  { fr: "« Cotisations. »", en: "“Contributions.”" },
  { fr: "« Aide. »", en: "“Help.”" },
  { fr: "« S'il vous plaît. »", en: "“Please.”" },
  { fr: "« Bonjour. »", en: "“Hello.”" },
  { fr: "« … »", en: "“…”" },
];

const NOT_UNDERSTOOD: L = {
  fr: "« Je n'ai pas compris. »",
  en: "“I didn't understand.”",
};

const VOICEBOT_LOOP: EventDef[] = [
  ...VOICEBOT_LINES.slice(1).map((line, i): EventDef => {
    const n = i + 2;
    const last = n === VOICEBOT_LINES.length;
    return {
      id: `urssaf-voicebot-${n}`,
      kind: "admin",
      tone: "bad",
      title: { fr: "L'IA de l'URSSAF", en: "The URSSAF voice bot" },
      text: {
        fr: `Tentative ${n}. « Je n'ai pas compris. Merci d'annoncer l'objet de votre demande. »`,
        en: `Attempt ${n}. “I didn't understand. Please state the reason for your call.”`,
      },
      choices: [
        {
          label: line,
          outcomes: [
            last
              ? {
                  effect: {},
                  then: "urssaf-voicebot-rating",
                  text: { fr: "« Merci. »", en: "“Thank you.”" },
                }
              : { effect: {}, then: `urssaf-voicebot-${n + 1}`, text: NOT_UNDERSTOOD },
          ],
        },
        {
          label: { fr: "Raccrocher", en: "Hang up" },
          outcomes: [
            {
              effect: { skipSlots: 1, moral: -4 },
              text: {
                fr: `Tu raccroches au bout de ${n} tentatives. Tu déclareras au pif ce soir.`,
                en: `You hang up after ${n} attempts. You'll guess on tonight's declaration.`,
              },
            },
          ],
        },
      ],
    };
  }),
  {
    id: "urssaf-voicebot-rating",
    kind: "admin",
    tone: "bad",
    title: { fr: "L'IA de l'URSSAF", en: "The URSSAF voice bot" },
    text: {
      fr: "« Pouvez-vous noter cette conversation de 1 à 5 ? »",
      en: "“Could you rate this conversation from 1 to 5?”",
    },
    choices: ["1", "2", "3", "4", "5"].map((note) => ({
      label: { fr: note, en: note },
      outcomes: [
        {
          effect: { skipSlots: 2, moral: note === "5" ? -8 : -6 },
          text:
            note === "5"
              ? {
                  fr: "Tu tapes 5, par réflexe. « Merci pour votre note ! » Un humain décroche, t'écoute, et te donne un autre numéro de l'URSSAF. Où une voix de synthèse te demande l'objet de ta demande. Ta réponse arrive en fin d'après-midi.",
                  en: "You press 5, out of habit. “Thank you for your rating!” A human picks up, listens, and gives you another URSSAF number. Where a synthetic voice asks for the reason for your call. You get your answer late in the afternoon.",
                }
              : {
                  fr: `Tu tapes ${note}. Un humain décroche, t'écoute, et te donne un autre numéro de l'URSSAF. Où une voix de synthèse te demande l'objet de ta demande. Ta réponse arrive en fin d'après-midi.`,
                  en: `You press ${note}. A human picks up, listens, and gives you another URSSAF number. Where a synthetic voice asks for the reason for your call. You get your answer late in the afternoon.`,
                },
        },
      ],
    })),
  },
];

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
  // The hotline lottery, after a founder who called URSSAF thirty times about
  // one blocked form and drew four different answers: "you should be able
  // to", "that's not possible", "call Emmanuel Macron", and at last "have you
  // tried the INPI?". One call is a draw; calling until the right answer
  // comes is certain, and costs the day.
  {
    id: "urssaf-hotline",
    kind: "admin",
    tone: "bad",
    title: { fr: "Le 3698", en: "The URSSAF hotline" },
    text: {
      fr: "Le site de l'URSSAF refuse ta déclaration de chiffre d'affaires : « Situation en cours d'examen ». Elle est due ce soir. Tu tapes les deux premiers chiffres de ton code postal. Petite musique.",
      en: "The URSSAF website won't take your revenue declaration: “Your situation is under review”. It is due tonight. You key in the first two digits of your postcode. Hold music.",
    },
    when: { launched: true, minDay: 12 },
    choices: [
      {
        label: { fr: "Tenter ta chance", en: "Try your luck" },
        outcomes: [
          {
            p: 0.3,
            effect: { skipSlots: 1, cash: -40, moral: -4 },
            text: {
              fr: "« C'est curieux, vous devriez pouvoir déclarer pourtant. » Tu demandes comment, vu que le site te bloque. « Ah, alors ce n'est pas possible. » 40 € de majoration de retard.",
              en: "“That's odd, you should be able to declare.” You ask how, since the site blocks you. “Ah, then it's not possible.” €40 late fee.",
            },
          },
          {
            p: 0.3,
            effect: { skipSlots: 1, cash: -40, moral: -5 },
            text: {
              fr: "« Ce n'est pas possible, il faut attendre la fin de l'examen de votre situation. » Combien de temps ? « Le temps que ce soit pris en compte. » 40 € de majoration de retard.",
              en: "“That's not possible, you have to wait until your situation has been reviewed.” How long? “As long as it takes to be taken into account.” €40 late fee.",
            },
          },
          {
            p: 0.2,
            effect: { skipSlots: 1, cash: -40, moral: -2 },
            text: {
              fr: "Tu insistes, tu expliques l'urgence. « Si vous n'êtes pas content, appelez Emmanuel Macron ! » Tu ris nerveusement. Tu paies 40 € de majoration quand même.",
              en: "You insist and explain it's urgent. “If you're not happy, call Emmanuel Macron!” You laugh, nervously. You pay a €40 late fee all the same.",
            },
          },
          {
            p: 0.2,
            effect: { skipSlots: 1, moral: 6 },
            text: {
              fr: "« Vous avez essayé en passant par l'INPI ? » Tu essaies. Ça passe du premier coup. Personne ne saura jamais pourquoi.",
              en: "“Have you tried going through the INPI?” You try. It goes through first time. Nobody will ever know why.",
            },
          },
        ],
      },
      {
        label: { fr: "Rappeler jusqu'à la bonne réponse", en: "Call back until you get the right answer" },
        outcomes: [
          {
            effect: { skipSlots: 3, moral: -3 },
            text: {
              fr: "Une trentaine d'appels et autant de départements. Un « c'est curieux », plusieurs « pas possible », un « appelez Macron ». Le trentième conseiller te parle de l'INPI. Déclaration envoyée à 23 h 48.",
              en: "Thirty calls or so, as many departments. One “that's odd”, several “not possible”, one “call Macron”. The thirtieth adviser mentions the INPI. Declaration sent at 11:48 p.m.",
            },
          },
        ],
      },
      {
        label: { fr: "Raccrocher et payer le retard (40 €)", en: "Hang up and pay the late fee (€40)" },
        outcomes: [
          {
            effect: { cash: -40, moral: -2 },
            text: {
              fr: "Tu raccroches avant la fin de la petite musique. La majoration arrivera par courrier, dans une enveloppe à fenêtre.",
              en: "You hang up before the hold music ends. The late fee will come by post, in a window envelope.",
            },
          },
        ],
      },
    ],
  },
  // Digital sovereignty, after a self-employed founder in 2026 whose password
  // stopped working the day an adjustment arrived. "Forgot password" said
  // they were not self-employed; the adviser who reset the account said a
  // Proton address would not do, only Gmail or Yahoo. The account was
  // deleted, and they went back to paper. Ignoring it is the real gamble: on
  // a misunderstanding, URSSAF can send a call for contributions that never
  // existed.
  {
    id: "urssaf-gmail",
    kind: "admin",
    tone: "bad",
    title: { fr: "Il faut une adresse Gmail", en: "It has to be Gmail" },
    text: {
      fr: "Un e-mail de régularisation. Tu te connectes : « Mot de passe invalide ». Mot de passe oublié : « Vous n'êtes pas travailleur indépendant ». Douze minutes d'attente plus tard, la conseillère réinitialise ton compte, puis revient : « Votre adresse ne fonctionne pas. Il faut un Gmail ou un Yahoo. » Tu es chez Proton.",
      en: "An adjustment email. You log in: “Invalid password”. Forgot password: “You are not self-employed”. Twelve minutes on hold later, the adviser resets your account, then comes back: “Your address doesn't work. It has to be Gmail or Yahoo.” You use Proton.",
    },
    when: { minDay: 10 },
    choices: [
      {
        label: { fr: "Créer un Gmail", en: "Make a Gmail address" },
        outcomes: [
          {
            effect: { skipSlots: 1, moral: -4 },
            text: {
              fr: "kebab.urssaf.2026@gmail.com. Le compte remarche. Tes cotisations sociales transitent désormais par un serveur en Californie, mais ça, l'URSSAF s'en fiche.",
              en: "kebab.urssaf.2026@gmail.com. The account works again. Your social contributions now pass through a server in California, but URSSAF doesn't mind.",
            },
          },
        ],
      },
      {
        label: { fr: "Défendre ta souveraineté numérique", en: "Stand up for digital sovereignty" },
        outcomes: [
          {
            effect: { skipSlots: 1, moral: -6 },
            text: {
              fr: "Tu cites le Cloud Act, le rapport du Sénat, la DINUM qui passe à Linux. « Impossible. Je ne peux rien faire. » Ton compte est supprimé, et personne ne peut t'en recréer un. Tu demandes le courrier papier, pour garder le contact.",
              en: "You quote the Cloud Act, the Senate report, the state moving its own PCs to Linux. “Impossible. There's nothing I can do.” Your account is deleted, and nobody can make you a new one. You ask for paper letters, to stay in touch.",
            },
          },
        ],
      },
      {
        label: { fr: "Ignorer le mail", en: "Ignore the email" },
        outcomes: [
          {
            p: 0.5,
            effect: {},
            text: {
              fr: "Tu ne l'ouvres plus. Rien ne se passe. Pour l'instant.",
              en: "You stop opening it. Nothing happens. For now.",
            },
          },
          {
            p: 0.5,
            effect: { cash: -180, moral: -8 },
            text: {
              fr: "Puisque tu n'es plus travailleur indépendant, l'URSSAF t'envoie un appel de cotisations pour une activité qu'elle t'invente : 180 €. Tu ne rigoles jamais avec l'URSSAF.",
              en: "Since you are no longer self-employed, URSSAF sends you a call for contributions on a business it made up for you: €180. You never joke with URSSAF.",
            },
          },
        ],
      },
    ],
  },
  // The attestation that buries the company, after an unpaid company head in
  // 2026 who asked URSSAF for a simple certificate of good standing for a
  // partner and was first sent one about an amicable liquidation
  // (art. L.243-15). The right one came only by post; their accountant
  // signed a sworn statement in the meantime. The deal is the prize: waiting
  // for the postman is a coin toss, the accountant is sure but costs money.
  {
    id: "urssaf-attestation",
    kind: "admin",
    tone: "bad",
    title: { fr: "Une simple attestation", en: "Just a certificate" },
    text: {
      fr: "Une boîte veut prendre un abonnement annuel, à une condition : une attestation de vigilance de l'URSSAF. Rien en ligne, tu appelles. Le conseiller t'envoie aussitôt une « Attestation relative aux déclarations sociales dans le cadre d'une liquidation amiable (art. L.243-15) ». Ta boîte est vivante. Il lui faut un moment pour le croire.",
      en: "A company wants an annual plan, on one condition: a certificate of good standing from URSSAF. Nothing online, so you call. The adviser sends you at once a “Certificate of social declarations in the course of an amicable liquidation (art. L.243-15)”. Your company is alive. It takes the adviser a while to believe it.",
    },
    when: { launched: true, minMrr: 30, minDay: 15 },
    choices: [
      {
        label: { fr: "Attendre le facteur", en: "Wait for the postman" },
        outcomes: [
          {
            p: 0.5,
            effect: { cash: 200, moral: 4 },
            text: {
              fr: "« Ce sera uniquement par courrier postal. » La bonne attestation arrive neuf jours plus tard. La boîte a attendu : 200 € d'abonnement annuel.",
              en: "“It will be by post only.” The right certificate arrives nine days later. The company waited: €200 for the annual plan.",
            },
          },
          {
            p: 0.5,
            effect: { moral: -6 },
            text: {
              fr: "« Ce sera uniquement par courrier postal. » La lettre arrive le jour où la boîte signe chez un concurrent. Ses attestations à lui sont en PDF.",
              en: "“It will be by post only.” The letter arrives the day the company signs with a competitor. Theirs come as PDFs.",
            },
          },
        ],
      },
      {
        label: { fr: "Passer par l'expert-comptable (90 €)", en: "Ask your accountant (€90)" },
        when: { minCash: 90 },
        outcomes: [
          {
            effect: { cash: 110, moral: 2 },
            text: {
              fr: "Ton expert-comptable signe une attestation sur l'honneur dans l'heure et te facture 90 €. La boîte signe : 200 € d'abonnement. La lettre de l'URSSAF arrivera quand elle arrivera.",
              en: "Your accountant signs a sworn statement within the hour and bills you €90. The company signs: €200 for the plan. The URSSAF letter will come when it comes.",
            },
          },
        ],
      },
      {
        label: { fr: "Envoyer celle que tu as", en: "Send the one you have" },
        outcomes: [
          {
            p: 0.25,
            effect: { cash: 200, moral: 3 },
            text: {
              fr: "Personne n'a lu au-delà du logo de l'URSSAF. La boîte signe : 200 € d'abonnement annuel.",
              en: "Nobody read past the URSSAF logo. The company signs: €200 for the annual plan.",
            },
          },
          {
            p: 0.75,
            effect: { moral: -7 },
            text: {
              fr: "« Vous êtes en liquidation ? » Leur juriste refuse de signer un abonnement annuel avec une boîte qui ferme. Tu as beau jurer que non, l'URSSAF dit que si.",
              en: "“You're in liquidation?” Their lawyer won't sign an annual plan with a company that is closing. You swear it isn't, but URSSAF says it is.",
            },
          },
        ],
      },
    ],
  },
  // The voice bot loop, after a founder in 2026 whose call to URSSAF met an
  // AI that never understood the reason for the call, asked them to rate the
  // conversation from 1 to 5, then passed them to a human who sent them to
  // another URSSAF number, and the same loop. Playing along is certain and
  // slow; shouting for an adviser is a coin toss; writing in costs no time
  // but may answer after the deadline.
  {
    id: "urssaf-voicebot",
    kind: "admin",
    tone: "bad",
    title: { fr: "L'IA de l'URSSAF", en: "The URSSAF voice bot" },
    text: {
      fr: "Une question simple avant ta déclaration de ce soir. Tu appelles l'URSSAF. Une voix de synthèse : « Merci d'annoncer l'objet de votre demande. »",
      en: "A simple question before tonight's declaration. You call URSSAF. A synthetic voice: “Please state the reason for your call.”",
    },
    when: { minDay: 8 },
    choices: [
      {
        label: VOICEBOT_LINES[0],
        outcomes: [{ effect: {}, then: "urssaf-voicebot-2", text: NOT_UNDERSTOOD }],
      },
      {
        label: { fr: "Crier « conseiller » en boucle", en: "Shout “adviser” on repeat" },
        outcomes: [
          {
            p: 0.5,
            effect: { skipSlots: 1, moral: 3 },
            text: {
              fr: "« Conseiller. CONSEILLER. Con-seil-ler. » Un déclic, de la musique, et une vraie personne répond à ta question en deux minutes. Comme avant.",
              en: "“Adviser. ADVISER. Ad-vi-ser.” A click, some music, and a real person answers your question in two minutes. Like before.",
            },
          },
          {
            p: 0.5,
            effect: { skipSlots: 1, moral: -5 },
            text: {
              fr: "« Je n'ai pas compris. Je n'ai pas compris. Au revoir. » Elle a raccroché. Tu as été largué par une IA.",
              en: "“I didn't understand. I didn't understand. Goodbye.” It hung up. You've been dumped by an AI.",
            },
          },
        ],
      },
      {
        label: { fr: "Écrire via la messagerie", en: "Write through the inbox" },
        outcomes: [
          {
            p: 0.6,
            effect: {},
            text: {
              fr: "Une réponse arrive à 19 h, signée d'un humain. Elle répond à ta question. Tu la relis deux fois, au cas où.",
              en: "An answer arrives at 7 p.m., signed by a human. It answers your question. You read it twice to be sure.",
            },
          },
          {
            p: 0.4,
            effect: { cash: -40, moral: -3 },
            text: {
              fr: "« Votre demande sera traitée sous 15 jours ouvrés. » Tu déclares au pif, à côté. 40 € de pénalité.",
              en: "“Your request will be handled within 15 working days.” You guess on the declaration, and guess wrong. €40 penalty.",
            },
          },
        ],
      },
    ],
  },
  ...VOICEBOT_LOOP,
  // The wrong addressee, after the Douai court which in January 2026 voided
  // an URSSAF audit and €834,290 of adjustments because the inspector had
  // written to the company's accountant, not its legal representative; the
  // Cour de cassation held in 2023 that inspectors may not ask documents of
  // an employee without a delegation. Here the flaw is a gamble: contesting
  // alone can win it all or reveal a delegation the founder forgot signing.
  {
    id: "urssaf-audit",
    kind: "admin",
    tone: "bad",
    title: { fr: "Contrôle URSSAF", en: "URSSAF audit" },
    text: {
      fr: "Lettre d'observations : 280 € de redressement sur tes frais professionnels. Tu n'as jamais vu passer le contrôle. Et pour cause : l'inspectrice a tout demandé à ton expert-comptable, jamais à toi, le dirigeant.",
      en: "Letter of findings: a €280 adjustment on your business expenses. You never saw the audit happen. No wonder: the inspector asked your accountant for everything, never you, the head of the company.",
    },
    when: { launched: true, minMrr: 40, minCash: 300, minDay: 25 },
    choices: [
      {
        label: { fr: "Payer (280 €)", en: "Pay (€280)" },
        outcomes: [
          {
            effect: { cash: -280, moral: -5 },
            text: {
              fr: "Tu paies. Tu ne sauras jamais ce que ton comptable leur a envoyé.",
              en: "You pay. You'll never know what your accountant sent them.",
            },
          },
        ],
      },
      {
        label: { fr: "Contester toi-même", en: "Contest it yourself" },
        outcomes: [
          {
            p: 0.6,
            effect: { skipSlots: 1, moral: 8 },
            text: {
              fr: "Tu cites l'arrêt de la Cour de cassation du 28 septembre 2023 : pas de documents demandés à un salarié sans délégation. Le contrôle est nul, le redressement annulé. Tu relis le courrier trois fois.",
              en: "You cite the Cour de cassation ruling of 28 September 2023: no documents asked of an employee without a delegation. The audit is void, the adjustment cancelled. You read the letter three times.",
            },
          },
          {
            p: 0.4,
            effect: { skipSlots: 1, cash: -310, moral: -8 },
            text: {
              fr: "L'URSSAF te renvoie une délégation signée de ta main, il y a deux ans, au milieu des papiers de création. Tu ne t'en souvenais pas. 280 €, plus 30 € de majorations.",
              en: "URSSAF sends back a delegation signed by you two years ago, among the company formation papers. You didn't remember it. €280, plus €30 in surcharges.",
            },
          },
        ],
      },
      {
        label: { fr: "Prendre un avocat (150 €)", en: "Hire a lawyer (€150)" },
        when: { minCash: 150 },
        outcomes: [
          {
            effect: { skipSlots: 1, cash: -150, moral: 3 },
            text: {
              fr: "L'avocate vérifie la délégation avant toi, trouve la faille et négocie. Il te reste sa facture. Moins chère que le redressement.",
              en: "The lawyer checks the delegation before you do, finds the flaw and negotiates. You're left with her bill. Cheaper than the adjustment.",
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
