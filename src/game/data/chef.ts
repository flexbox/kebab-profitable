import type { L } from "../types";

/**
 * Chef, the owner of the kebab shop downstairs. He is the only profitable
 * entrepreneur in the game, and he lets you know. He calls you "chef" too.
 */
export type ChefCue =
  | "start"
  | "kebab"
  | "pates"
  | "skip"
  | "welsh"
  | "firstCustomer"
  | "mrr100"
  | "mrr200"
  | "lowCash"
  | "launch"
  | "flop"
  | "pivot"
  | "report"
  | "apero"
  | "lostDay"
  | "win"
  | "loseCash"
  | "loseCdi";

export const CHEF: Record<ChefCue, L[]> = {
  start: [
    {
      fr: "Bienvenue dans le quartier, chef. La rentabilité, c'est simple : un kebab par jour. 270 € par mois.",
      en: "Welcome to the neighbourhood, chef. Profitability is simple: one kebab a day. €270 a month.",
    },
  ],
  kebab: [
    {
      fr: "Salade, tomate, oignon ? Et ton MRR, il en est où ?",
      en: "Lettuce, tomato, onion? And how is that MRR coming along?",
    },
    {
      fr: "Neuf euros, chef. Chez moi, les clients paient avant de manger.",
      en: "Nine euros, chef. In my shop, customers pay before they eat.",
    },
    {
      fr: "Tu vois cette broche ? Rentable depuis le premier jour.",
      en: "See that spit? Profitable since day one.",
    },
    {
      fr: "Sauce blanche ou samouraï ? Prends ton temps, c'est ta seule décision facile de la journée.",
      en: "White sauce or samurai? Take your time, it is your only easy decision today.",
    },
    {
      fr: "Mon acquisition client, c'est l'odeur. Zéro euro de pub, chef.",
      en: "My customer acquisition is the smell. Zero euros of ads, chef.",
    },
    {
      fr: "Moi aussi je fais du build in public : la broche est en vitrine.",
      en: "I build in public too: the spit is in the window.",
    },
  ],
  pates: [
    {
      fr: "Encore des pâtes au beurre ? Ma marge pleure, chef.",
      en: "Buttered pasta again? My margin is weeping, chef.",
    },
    {
      fr: "Je t'ai vu passer avec ton paquet de coquillettes. Je ne juge pas. Un peu.",
      en: "I saw you walk past with your bag of pasta. I'm not judging. A little.",
    },
    {
      fr: "Des pâtes. Ton churn à toi, c'est moi qui le subis.",
      en: "Pasta. I am the one who feels your churn.",
    },
  ],
  skip: [
    {
      fr: "Tu sautes le repas ? Même mes frites ont plus d'énergie que toi.",
      en: "Skipping lunch? Even my fries have more energy than you.",
    },
    {
      fr: "Ventre vide, code faible. Ma grand-mère disait ça. Enfin, presque.",
      en: "Empty stomach, weak code. My grandmother used to say that. More or less.",
    },
  ],
  welsh: [
    {
      fr: "Un welsh ? Tu me trompes avec l'estaminet d'en face, chef.",
      en: "A welsh? You're cheating on me with the estaminet across the road, chef.",
    },
    {
      fr: "Cheddar, bière, jambon. Bonne sieste cet après-midi.",
      en: "Cheddar, beer, ham. Enjoy your nap this afternoon.",
    },
  ],
  firstCustomer: [
    {
      fr: "Un client ! Garde le ticket, chef. Le premier, on l'encadre.",
      en: "A customer! Keep the receipt, chef. You frame the first one.",
    },
  ],
  mrr100: [
    {
      fr: "100 € de MRR. Ça fait onze kebabs par mois. On se rapproche.",
      en: "€100 of MRR. That makes eleven kebabs a month. Getting closer.",
    },
  ],
  mrr200: [
    {
      fr: "200 €. Encore un effort et tu manges ici tous les jours.",
      en: "€200. One more push and you eat here every day.",
    },
  ],
  lowCash: [
    {
      fr: "Ton compte fait la tête, chef. Une petite mission freelance, ça n'a jamais tué personne.",
      en: "Your bank balance is sulking, chef. A little freelance gig never killed anyone.",
    },
  ],
  launch: [
    {
      fr: "Alors ça y est, c'est en ligne ? Moi, mon lancement, c'était une ardoise sur le trottoir.",
      en: "So it's live? My own launch was a chalkboard on the pavement.",
    },
  ],
  flop: [
    {
      fr: "Personne n'achète ? Change la recette, chef. Moi, j'ai arrêté la pizza en 2012.",
      en: "Nobody is buying? Change the recipe, chef. I gave up pizza in 2012.",
    },
  ],
  pivot: [
    {
      fr: "Nouveau projet ? La broche tourne, chef. Toi aussi.",
      en: "New project? The spit keeps turning, chef. So do you.",
    },
  ],
  report: [
    {
      fr: "Fin du mois. Le loyer, l'URSSAF… Je connais, chef. Je connais.",
      en: "End of the month. Rent, URSSAF… I know, chef. I know.",
    },
  ],
  apero: [
    {
      fr: "Tu vas au Charlatan ce soir ? Mange avant, on ne boit pas le ventre vide.",
      en: "Off to Le Charlatan tonight? Eat first, never drink on an empty stomach.",
    },
  ],
  lostDay: [
    {
      fr: "On ne t'a pas vu de la journée, chef. Même une broche, ça se repose.",
      en: "Didn't see you all day, chef. Even a spit needs a rest.",
    },
  ],
  win: [
    {
      fr: "Kebab profitable ! À partir d'aujourd'hui, tu as ta table ici, chef.",
      en: "Kebab profitable! From today, you have your own table here, chef.",
    },
  ],
  loseCash: [
    {
      fr: "Le CDI, ce n'est pas la fin, chef. Reviens quand tu veux, la broche tourne.",
      en: "A day job is not the end, chef. Come back whenever, the spit keeps turning.",
    },
  ],
  loseCdi: [
    {
      fr: "55 k€ et un baby-foot. Tu passeras quand même me voir le midi ?",
      en: "€55k and table football. You'll still drop by at lunch, won't you?",
    },
  ],
};

/**
 * Lines for the milestones, written as stage directions about pixel versions
 * of famous figures. They are jokes, never quotes.
 */
export const MILESTONES: Record<"firstCustomer" | "mrr100" | "kebab", L> = {
  firstCustomer: {
    fr: "Quelque part, un Pieter Levels en pixels lève le pouce sans quitter son écran des yeux.",
    en: "Somewhere, a pixel Pieter Levels gives a thumbs-up without taking his eyes off the screen.",
  },
  mrr100: {
    fr: "À Bali, un Marc Lou en pixels sent une légère vibration dans le MRR mondial.",
    en: "In Bali, a pixel Marc Lou senses a faint tremor in the world's MRR.",
  },
  kebab: {
    fr: "Ton nom apparaît tout en bas d'un classement de revenus vérifiés. Tout en bas, mais dessus.",
    en: "Your name appears at the very bottom of a verified revenue leaderboard. The very bottom, but on it.",
  },
};
