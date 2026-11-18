import type { CharacterDef, CharacterId } from "../types";

/**
 * The playable members of Indie Hackers Lille.
 *
 * Each card is a perk, a flaw and a signature idea. The numbers live in
 * `mods`; the text only describes them. Members can veto or reword their own
 * card with a pull request.
 */
export const CHARACTERS: CharacterDef[] = [
  {
    id: "david",
    name: "David Leuliette",
    role: {
      fr: "Dev mobile, fan de Raycast, DJ des retreats",
      en: "Mobile dev, Raycast fan, retreat DJ",
    },
    perk: {
      name: { fr: "Raccourci Raycast", en: "Raycast shortcut" },
      desc: {
        fr: "Une action bonus tous les trois jours. Aux apéros et en retreat, il passe derrière les platines : deux fois plus de moral.",
        en: "A bonus action every third day. At apéros and retreats he takes the decks: twice the morale.",
      },
    },
    flaw: {
      name: { fr: "100 % over-engineered", en: "100% over-engineered" },
      desc: {
        fr: "Chaque feature lui prend plus de temps : Coder rapporte 20 % de points en moins.",
        en: "Every feature takes him longer: Code yields 20% fewer points.",
      },
    },
    signatureIdea: "app-mobile",
    site: "https://weshipit.today",
    handle: "flexbox_",
    mods: { coderMult: 0.8, bonusSlotEvery: 3, socialMoralMult: 2 },
  },
  {
    id: "karl",
    name: "Karl Leicht",
    role: {
      fr: "Docteur en maths, fondateur de Vigie",
      en: "PhD in maths, founder of Vigie",
    },
    perk: {
      name: { fr: "Docteur en maths", en: "PhD in maths" },
      desc: {
        fr: "Il voit les chiffres cachés : le vrai potentiel des idées et les probabilités des événements.",
        en: "He sees the hidden numbers: the real potential of ideas and the odds on events.",
      },
    },
    flaw: {
      name: { fr: "Cycle enterprise", en: "Enterprise cycle" },
      desc: {
        fr: "Ses clients paient 30 % plus cher, mais ils sont plus rares et mettent 4 jours à signer après un lancement.",
        en: "His customers pay 30% more, but they are rarer and take 4 days to sign after a launch.",
      },
    },
    signatureIdea: "vigie",
    site: "https://vigie.co",
    handle: "leichtdev",
    mods: { seesHidden: true, priceMult: 1.3, inboundMult: 0.75, launchDelay: 4 },
  },
  {
    id: "mickael",
    name: "Mickael Bourgois",
    role: {
      fr: "Pas dev, a quand même shippé un SaaS",
      en: "Not a dev, shipped a SaaS anyway",
    },
    perk: {
      name: { fr: "Pas dev, et alors ?", en: "Not a dev, so what?" },
      desc: {
        fr: "Il sait vendre : Poster et Démarcher rapportent 50 % de plus.",
        en: "He knows how to sell: Post and Outreach yield 50% more.",
      },
    },
    flaw: {
      name: { fr: "Ça marche chez moi", en: "Works on my machine" },
      desc: {
        fr: "Ses builds sont moins solides : la qualité du produit monte 40 % moins vite, donc plus de churn.",
        en: "His builds are shakier: product quality rises 40% slower, which means more churn.",
      },
    },
    signatureIdea: "scrybecast",
    site: "https://scrybecast.studio",
    mods: { marketingMult: 1.5, qualityMult: 0.6 },
  },
  {
    id: "christophe",
    name: "Christophe Ribeiro",
    role: {
      fr: "Entrepreneur, ingénieur, super-héros des mises en relation",
      en: "Entrepreneur, engineer, superhero of introductions",
    },
    perk: {
      name: { fr: "Super connecteur", en: "Super connector" },
      desc: {
        fr: "Les bonnes rencontres arrivent plus souvent, et chaque apéro lui rapporte une intro.",
        en: "Good encounters happen more often, and every apéro gets him an intro.",
      },
    },
    flaw: {
      name: { fr: "« Un café ? »", en: "“Coffee?”" },
      desc: {
        fr: "De temps en temps, son après-midi part dans un café qu'il n'a pas su refuser.",
        en: "Now and then his afternoon goes to a coffee he couldn't turn down.",
      },
    },
    signatureIdea: "eanscan",
    site: "https://christoribeiro.com",
    mods: { cameoBoost: 0.14, aperoIntroSure: true, coffeeChance: 0.1 },
  },
  {
    id: "matthys",
    name: "Matthys Ducrocq",
    role: { fr: "Dev mobile, cool kid", en: "Mobile dev, cool kid" },
    perk: {
      name: { fr: "Cool kid", en: "Cool kid" },
      desc: {
        fr: "Il récupère 30 % d'énergie en plus, et ses posts deviennent viraux deux fois plus souvent.",
        en: "He recovers 30% more energy, and his posts go viral twice as often.",
      },
    },
    flaw: {
      name: { fr: "Shiny object", en: "Shiny object" },
      desc: {
        fr: "Une fois sur dix, sa session de code part en réécriture complète de la stack.",
        en: "One coding session in ten goes to rewriting the whole stack.",
      },
    },
    signatureIdea: "ekklo",
    site: "https://www.matthys.dev",
    mods: { sleepMult: 1.3, viralMult: 2, shinyChance: 0.1 },
  },
];

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);

export function character(id: CharacterId): CharacterDef {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown character: ${id}`);
  return found;
}
