import type { GuestDef, GuestId } from "../types";

/**
 * The public figures who turn up on cameo cards, with their handle on X.
 *
 * Each one is drawn as a 32 by 32 pixel version of their X avatar, in
 * `art/faces.px.js` (look for `GUESTS`). The avatars themselves are only a
 * reference: they stay in `reference/guests/`, which is never committed.
 *
 * `lesson` is shown under the result of their card, as "in real life": one
 * thing a founder can do this week, taken from what the card says they are
 * known for. It is the game's advice in the game's words, never a quote, and
 * the player can thank them for it on X. Keep it under 150 characters, so the
 * post fits.
 */
export const GUESTS: Record<GuestId, GuestDef> = {
  levels: {
    name: "Pieter Levels",
    handle: "levelsio",
    lesson: {
      fr: "Mets en ligne cette semaine une version qui ne fait qu'une chose. La liste de 47 tâches attendra tes premiers utilisateurs.",
      en: "Put a version online this week that does one thing. The 47-item list can wait for your first users.",
    },
  },
  marc: {
    name: "Marc Lou",
    handle: "marclou",
    lesson: {
      fr: "Prépare ton lancement comme une fonctionnalité : une vidéo d'une minute qui montre le problème, puis ton produit qui le règle.",
      en: "Build your launch like a feature: a one-minute video that shows the problem, then your product fixing it.",
    },
  },
  tibo: {
    name: "Tibo Louis-Lucas",
    handle: "tibo_maker",
    lesson: {
      fr: "Tiens tes chiffres propres dès le premier client : MRR, churn, coûts. Un produit qui se lit en cinq minutes peut se vendre.",
      en: "Keep clean numbers from your first customer: MRR, churn, costs. A product that reads in five minutes can be sold.",
    },
  },
  dago: {
    name: "Dagobert Renouf",
    handle: "dagorenouf",
    lesson: {
      fr: "Cherche l'idée de marketing que les gens auront envie de raconter. Une seule idée qui fait parler vaut cent posts sages.",
      en: "Look for the marketing idea people will want to retell. One idea that gets talked about beats a hundred safe posts.",
    },
  },
  nico: {
    name: "Nico Jeannen",
    handle: "nico_jeannen",
    lesson: {
      fr: "Donne une date limite à chaque projet. Sans client payant ce jour-là, lance le suivant : on trouve ce qui prend en lançant souvent.",
      en: "Give every project a deadline. No paying customer by then? Ship the next one: you find what catches on by launching often.",
    },
  },
  thomas: {
    name: "Thomas Sanlis",
    handle: "T_Zahil",
    lesson: {
      fr: "Un lancement, ça se refait. Liste cinq plateformes, et relance ton produit sur chacune à chaque grosse mise à jour.",
      en: "A launch can be done again. List five platforms and relaunch your product on each with every big update.",
    },
  },
  tony: {
    name: "Tony Dinh",
    handle: "tdinh_me",
    lesson: {
      fr: "Publie tes chiffres chaque mois, à date fixe, même quand la courbe est plate. C'est la régularité qui crée la confiance.",
      en: "Post your numbers every month, on a fixed date, even when the line is flat. Regularity is what builds trust.",
    },
  },
  danny: {
    name: "Danny Postma",
    handle: "dannypostma",
    lesson: {
      fr: "Choisis un problème que les gens tapent déjà dans Google et paient déjà pour régler. La demande existe : réponds-y mieux.",
      en: "Pick a problem people already type into Google and already pay to solve. The demand exists: answer it better.",
    },
  },
  arvid: {
    name: "Arvid Kahl",
    handle: "arvidkahl",
    lesson: {
      fr: "Raconte ton parcours en public, pas ta recette. Un clone copie ton code, pas la confiance de tes clients.",
      en: "Share your journey in public, not your recipe. A clone copies your code, not your customers' trust.",
    },
  },
  benjamin: {
    name: "Benjamin Code",
    handle: "benjamincode",
    lesson: {
      fr: "Montre ce que tu construis pendant que tu le construis. Le travail en cours attire plus de monde que l'annonce du résultat.",
      en: "Show what you build while you build it. Work in progress draws more people than the finished announcement.",
    },
  },
  flavie: {
    name: "Flavie Prévot",
    handle: "FlaviePrevot",
    lesson: {
      fr: "Vends avant de construire : trouve trois personnes prêtes à payer avant d'écrire la première ligne de code.",
      en: "Sell before you build: find three people ready to pay before you write the first line of code.",
    },
  },
  ih: {
    name: "Indie Hackers",
    handle: "IndieHackers",
    lesson: {
      fr: "Publie tes vrais chiffres et ce qui te bloque, puis pose une question précise. On aide ceux qui disent où ils coincent.",
      en: "Post your real numbers and what blocks you, then ask one precise question. People help those who say where they are stuck.",
    },
  },
};

export function guest(id: GuestId): GuestDef {
  return GUESTS[id];
}
