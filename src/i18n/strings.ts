import type { L } from "@/game/types";

/** Interface text. Game content (cards, ideas, events) lives in src/game/data. */
export const UI = {
  tagline: {
    fr: "Deviens rentable, un kebab à la fois.",
    en: "Get profitable, one kebab at a time.",
  },
  pitch: {
    fr: "Tu viens de quitter ton CDI. Tu as 1 500 €, un studio à Lille et un kebab en bas de chez toi. Objectif : 270 € de MRR, le prix d'un kebab par jour.",
    en: "You just quit your job. You have €1,500, a studio in Lille and a kebab shop downstairs. The goal: €270 of MRR, the price of a kebab a day.",
  },
  playToday: { fr: "Jouer la partie du jour", en: "Play today's run" },
  resume: { fr: "Reprendre la partie", en: "Resume your run" },
  newRun: { fr: "Nouvelle partie", en: "New run" },
  sameRun: {
    fr: "Tout le monde joue la même partie aujourd'hui : mêmes idées, mêmes événements.",
    en: "Everyone plays the same run today: same ideas, same events.",
  },
  attemptsToday: (n: number): L => ({
    fr: n === 0 ? "Premier essai du jour." : `Essais aujourd'hui : ${n}.`,
    en: n === 0 ? "First attempt today." : `Attempts today: ${n}.`,
  }),
  bestToday: (days: number): L => ({
    fr: `Ton record du jour : ${days} jours.`,
    en: `Your best today: ${days} days.`,
  }),
  howTitle: { fr: "Comment on joue", en: "How to play" },
  how: [
    {
      fr: "Chaque jour a trois créneaux : matin, après-midi, soir. Une action par créneau.",
      en: "Each day has three slots: morning, afternoon, evening. One action per slot.",
    },
    {
      fr: "Code ton MVP, shippe-le, fais grandir ton audience. Si l'idée fait un flop, pivote.",
      en: "Code your MVP, ship it, grow your audience. If the idea flops, pivot.",
    },
    {
      fr: "Mange le midi. Le loyer tombe à la fin du mois. À zéro euro, c'est retour au CDI.",
      en: "Eat at midday. Rent is due at month-end. At zero euros, it's back to a day job.",
    },
    {
      fr: "Parfois, une carte urgente tombe en pleine journée : quelques secondes pour choisir. Le bouton chronomètre, en haut, coupe le compte à rebours.",
      en: "Now and then an urgent card lands in the middle of the day: a few seconds to choose. The stopwatch button, at the top, turns the countdown off.",
    },
  ] as L[],
  disclaimer: {
    fr: "Parodie affectueuse, sans lien avec les personnes citées ni avec indiehackers.com. Une carte te concerne et te déplaît ? Ouvre une issue, elle sera retirée.",
    en: "An affectionate parody, not affiliated with the people it mentions or with indiehackers.com. A card about you bothers you? Open an issue and it will be removed.",
  },
  madeBy: {
    fr: "Fait pour les Indie Hackers Lille. Code ouvert sur GitHub.",
    en: "Made for Indie Hackers Lille. Open source on GitHub.",
  },

  /**
   * The intro, shown before a new run. First the walk home, one caption after
   * another, then what Chef has to say. `dare` marks the line he says with the
   * knife catching the light.
   */
  intro: {
    street: [
      { fr: "Lille, 31 décembre 2026. Il pleut.", en: "Lille, 31 December 2026. It is raining." },
      {
        fr: "Tu viens de signer ta rupture conventionnelle.",
        en: "You have just signed your rupture conventionnelle: the French way to leave a job.",
      },
      {
        fr: "Fini le CDI. Finies les réunions. Fini le salaire.",
        en: "No more permanent contract. No more meetings. No more salary.",
      },
      {
        fr: "Dans ton carton : une plante, un mug et 1 500 € d'économies.",
        en: "In your box: a plant, a mug and €1,500 of savings.",
      },
      {
        fr: "En bas de chez toi, quelqu'un t'attend.",
        en: "Downstairs from your flat, someone is waiting.",
      },
    ] as L[],
    chef: [
      {
        text: {
          fr: "Alors comme ça, tu montes ta boîte, chef ?",
          en: "So you are starting a company, chef?",
        },
      },
      {
        text: {
          fr: "Vingt ans que ma broche tourne. Rentable depuis le premier jour.",
          en: "My spit has turned for twenty years. Profitable since day one.",
        },
      },
      {
        text: { fr: "Fais plus de thune que moi. Si tu peux.", en: "Make more money than me. If you can." },
        dare: true,
      },
      {
        text: {
          fr: "Commence petit, chef : 270 € par mois. Un kebab par jour.",
          en: "Start small, chef: €270 a month. One kebab a day.",
        },
      },
    ] as { text: L; dare?: boolean }[],
    chefRole: { fr: "Maître kebabier", en: "Kebab master" },
    /** How a line of Chef's is read out. */
    chefSays: (line: string): L => ({ fr: `Chef : ${line}`, en: `Chef: ${line}` }),
    skip: { fr: "Passer l'intro", en: "Skip the intro" },
    next: { fr: "Suivant", en: "Next" },
    accept: { fr: "Relever le défi", en: "Take up the challenge" },
    hint: {
      fr: "Entrée ou un clic pour avancer, Échap pour passer.",
      en: "Enter or a click to move on, Escape to skip.",
    },
    streetLabel: {
      fr: "Une rue de Lille, un soir de pluie. Quelqu'un sort d'une tour de bureaux, un carton dans les bras, et marche jusqu'à un kebab.",
      en: "A street in Lille on a rainy evening. Someone leaves an office tower with a box in their arms and walks to a kebab shop.",
    },
    chefLabel: {
      fr: "Le patron du kebab, bras croisés, un long couteau à la main, à côté de sa broche.",
      en: "The owner of the kebab shop, arms crossed, a long knife in his hand, next to his spit.",
    },
  },

  chooseCharacter: { fr: "Choisis ton indie hacker", en: "Choose your indie hacker" },
  perk: { fr: "Atout", en: "Perk" },
  flaw: { fr: "Défaut", en: "Flaw" },
  signature: { fr: "Idée fétiche", en: "Signature idea" },
  playAs: (name: string): L => ({
    fr: `Jouer avec ${name}`,
    en: `Play as ${name}`,
  }),
  custom: { fr: "Crée le tien", en: "Create your own" },
  customSoon: {
    fr: "Bientôt. En attendant, propose ta carte par pull request.",
    en: "Coming soon. Meanwhile, send your card as a pull request.",
  },
  back: { fr: "Retour", en: "Back" },
  home: { fr: "Retour à l'accueil", en: "Back to home" },

  day: (n: number): L => ({ fr: `Jour ${n}`, en: `Day ${n}` }),
  slots: [
    { fr: "Matin", en: "Morning" },
    { fr: "Après-midi", en: "Afternoon" },
    { fr: "Soir", en: "Evening" },
    { fr: "Bonus", en: "Bonus" },
  ] as L[],
  askSlot: [
    { fr: "Que fais-tu ce matin ?", en: "What do you do this morning?" },
    { fr: "Que fais-tu cet après-midi ?", en: "What do you do this afternoon?" },
    { fr: "Que fais-tu ce soir ?", en: "What do you do this evening?" },
    {
      fr: "Raccourci Raycast : une action bonus. Laquelle ?",
      en: "Raycast shortcut: a bonus action. Which one?",
    },
  ] as L[],
  askMeal: { fr: "Midi. Tu manges quoi ?", en: "Midday. What are you eating?" },
  askIdea: { fr: "Choisis ton projet", en: "Choose your project" },
  askIdeaSub: {
    fr: "Trois idées. Le marché dira laquelle valait le coup, une fois lancée.",
    en: "Three ideas. The market will say which one was worth it, once launched.",
  },

  slotsLabel: { fr: "Créneaux du jour", en: "Today's slots" },
  /** Spelled out next to a red gauge, so colour is not the only warning. */
  low: { fr: "bas", en: "low" },
  empty: { fr: "vide", en: "empty" },
  tones: {
    good: { fr: "Bonne nouvelle", en: "Good news" },
    bad: { fr: "Coup dur", en: "Setback" },
  },
  oddsTone: {
    good: { fr: "issue favorable", en: "good outcome" },
    bad: { fr: "issue défavorable", en: "bad outcome" },
    neutral: { fr: "issue neutre", en: "neutral outcome" },
  },
  faim: { fr: "Faim", en: "Hunger" },
  energie: { fr: "Énergie", en: "Energy" },
  moral: { fr: "Moral", en: "Morale" },
  cash: { fr: "Cash", en: "Cash" },
  audience: { fr: "Audience", en: "Audience" },
  mrr: { fr: "MRR", en: "MRR" },
  goal: { fr: "Objectif kebab", en: "Kebab goal" },
  efficiency: (pct: number): L => ({
    fr: `Efficacité : ${pct} %`,
    en: `Efficiency: ${pct}%`,
  }),
  effWhy: {
    faim: { fr: "ventre vide", en: "empty stomach" },
    energie: { fr: "fatigue", en: "tired" },
    moral: { fr: "moral en berne", en: "low morale" },
    welsh: { fr: "digestion du welsh", en: "digesting the welsh" },
  },

  project: { fr: "Projet", en: "Project" },
  noProject: {
    fr: "Pas encore de projet. Choisis une idée pour commencer.",
    en: "No project yet. Choose an idea to get started.",
  },
  mvp: { fr: "MVP", en: "MVP" },
  quality: { fr: "Qualité", en: "Quality" },
  customers: { fr: "Clients", en: "Customers" },
  price: { fr: "Prix", en: "Price" },
  perMonth: { fr: "/mois", en: "/mo" },
  potential: { fr: "Potentiel", en: "Potential" },
  potentials: [
    { fr: "Flop", en: "Flop" },
    { fr: "Tiède", en: "Lukewarm" },
    { fr: "Correct", en: "Decent" },
    { fr: "Bon", en: "Good" },
    { fr: "Pépite", en: "Gem" },
  ] as L[],
  potentialUnknown: { fr: "Inconnu avant le lancement", en: "Unknown until launch" },
  awaiting: { fr: "Lancement en attente de résultats", en: "Launch awaiting results" },
  readyToShip: { fr: "Prêt à shipper", en: "Ready to ship" },
  updateReady: { fr: "Mise à jour prête", en: "Update ready" },
  churn: (pct: number): L => ({
    fr: `Churn estimé : ${pct} % par mois`,
    en: `Estimated churn: ${pct}% a month`,
  }),
  ideaMvp: (slots: number): L => ({
    fr: `MVP : environ ${slots} créneaux de code`,
    en: `MVP: about ${slots} slots of code`,
  }),
  ideaNeed: (n: number): L => ({
    fr: `${n} ${n > 1 ? "clients" : "client"} pour l'objectif`,
    en: `${n} ${n > 1 ? "customers" : "customer"} to reach the goal`,
  }),
  tags: {
    mobile: { fr: "Mobile", en: "Mobile" },
    ai: { fr: "IA", en: "AI" },
    b2b: { fr: "B2B", en: "B2B" },
    content: { fr: "Contenu", en: "Content" },
  },
  yours: { fr: "Ton idée fétiche", en: "Your signature idea" },

  kinds: {
    cameo: { fr: "Caméo", en: "Cameo" },
    admin: { fr: "Paperasse", en: "Paperwork" },
    lille: { fr: "Lille", en: "Lille" },
    scene: { fr: "La scène", en: "The scene" },
    urgent: { fr: "Urgent", en: "Urgent" },
  },
  /** Read out when an urgent card lands. */
  urgentAlert: (seconds: number): L => ({
    fr: `Carte urgente : ${seconds} secondes pour répondre.`,
    en: `Urgent card: ${seconds} seconds to answer.`,
  }),
  timeLeft: { fr: "Temps restant", en: "Time left" },
  seconds: (n: number): L => ({ fr: `${n} s`, en: `${n}s` }),
  tooLate: { fr: "Trop tard", en: "Too late" },
  clockIsOff: {
    fr: "Chronomètre coupé : prends ton temps.",
    en: "The clock is off: take your time.",
  },
  justNow: { fr: "Ce qui vient de se passer", en: "What just happened" },
  continue: { fr: "Continuer", en: "Continue" },
  odds: (pct: number): L => ({ fr: `${pct} %`, en: `${pct}%` }),

  reportTitle: (month: string): L => ({
    fr: `Bilan de ${month}`,
    en: `${month} report`,
  }),
  revenue: { fr: "Revenus du mois", en: "Revenue this month" },
  held: { fr: "Retenu par Stripe", en: "Held by Stripe" },
  released: { fr: "Débloqué par Stripe", en: "Released by Stripe" },
  urssaf: { fr: "URSSAF (22 %)", en: "URSSAF (22%)" },
  rent: { fr: "Loyer", en: "Rent" },
  balance: { fr: "Sur ton compte", en: "In your account" },
  reportSummary: (gained: number, lost: number, mrr: string): L => ({
    fr: `Clients gagnés : ${gained} · Clients perdus : ${lost} · MRR : ${mrr}`,
    en: `Customers gained: ${gained} · Customers lost: ${lost} · MRR: ${mrr}`,
  }),
  nextMonth: { fr: "Passer au mois suivant", en: "Start next month" },

  journal: { fr: "Journal", en: "Journal" },
  quit: { fr: "Abandonner", en: "Give up" },
  quitConfirm: {
    fr: "Abandonner cette partie ? Elle comptera comme un essai.",
    en: "Give up this run? It will count as an attempt.",
  },
  aperoIn: (days: number): L => ({
    fr: days === 0 ? "Apéro ce soir au Charlatan" : `Apéro dans ${days} j`,
    en: days === 0 ? "Apéro tonight at Le Charlatan" : `Apéro in ${days}d`,
  }),
  rentIn: (days: number): L => ({
    fr: days === 0 ? "Loyer ce soir" : `Loyer dans ${days} j`,
    en: days === 0 ? "Rent due tonight" : `Rent in ${days}d`,
  }),
  out: { fr: "Sorti", en: "Out" },

  wonTitle: { fr: "Kebab profitable !", en: "Kebab profitable!" },
  wonSub: (days: number, name: string): L => ({
    fr: `En ${days} jours, avec ${name}.`,
    en: `In ${days} days, as ${name}.`,
  }),
  lostCashTitle: { fr: "Retour au CDI", en: "Back to the day job" },
  lostCashSub: (days: number): L => ({
    fr: `Tu as tenu ${days} jours. Le loyer, lui, n'a pas attendu.`,
    en: `You lasted ${days} days. The rent did not wait.`,
  }),
  lostCdiTitle: { fr: "La cage dorée", en: "The golden cage" },
  lostCdiSub: (days: number): L => ({
    fr: `Tu as signé au jour ${days}. 55 k€, des tickets resto et un baby-foot.`,
    en: `You signed on day ${days}. €55k, meal vouchers and table football.`,
  }),
  bestMrr: (mrr: string): L => ({
    fr: `MRR à la fin : ${mrr}`,
    en: `MRR at the end: ${mrr}`,
  }),
  stats: {
    kebabs: { fr: "Kebabs", en: "Kebabs" },
    pates: { fr: "Pâtes au beurre", en: "Buttered pastas" },
    welshs: { fr: "Welshs", en: "Welshes" },
    posts: { fr: "Posts", en: "Posts" },
    pivots: { fr: "Pivots", en: "Pivots" },
    launches: { fr: "Mises en ligne", en: "Releases" },
    freelance: { fr: "Missions freelance", en: "Freelance gigs" },
    aperos: { fr: "Apéros", en: "Apéros" },
    lostDays: { fr: "Jours perdus", en: "Lost days" },
  },
  retry: { fr: "Rejouer", en: "Play again" },
  share: { fr: "Partager sur X", en: "Share on X" },
  newTab: { fr: "(nouvel onglet)", en: "(opens in a new tab)" },
  shareWon: (days: number, name: string): L => ({
    fr: `J'ai rendu ${name} kebab profitable en ${days} jours 🥙 À toi de battre ça :`,
    en: `I got ${name} to kebab profitable in ${days} days 🥙 Your turn to beat it:`,
  }),
  shareLost: (days: number, name: string): L => ({
    fr: `${name} a tenu ${days} jours avant de retourner au CDI 🥙 Tu feras mieux ?`,
    en: `${name} lasted ${days} days before going back to a day job 🥙 Think you can do better?`,
  }),

  leaderboard: { fr: "Classement", en: "Leaderboard" },
  today: { fr: "Aujourd'hui", en: "Today" },
  allTime: { fr: "Depuis toujours", en: "All-time" },
  rank: { fr: "#", en: "#" },
  player: { fr: "Joueur", en: "Player" },
  days: { fr: "Jours", en: "Days" },
  tries: { fr: "Essais", en: "Tries" },
  noScores: {
    fr: "Personne n'est encore kebab profitable. À toi.",
    en: "Nobody is kebab profitable yet. Your move.",
  },
  yourPseudo: { fr: "Ton pseudo", en: "Your name" },
  pseudoHint: { fr: "De 2 à 16 caractères.", en: "2 to 16 characters." },
  submit: { fr: "Inscrire mon score", en: "Submit my score" },
  submitting: { fr: "Vérification…", en: "Checking…" },
  submitted: (rank: number): L => ({
    fr: `Score inscrit. Tu es ${rank === 1 ? "1er" : `${rank}e`} aujourd'hui.`,
    en: `Score saved. You are #${rank} today.`,
  }),
  errors: {
    pseudo: {
      fr: "Choisis un pseudo de 2 à 16 caractères, sans gros mots.",
      en: "Pick a name of 2 to 16 characters, and keep it clean.",
    },
    stale: {
      fr: "Cette partie date d'un autre jour : son score ne peut plus être inscrit. Joue la partie du jour pour entrer au classement.",
      en: "This run is from another day, so its score can no longer be submitted. Play today's run to enter the leaderboard.",
    },
    invalid: {
      fr: "Le serveur n'a pas pu vérifier cette partie. Réessaie ; si l'erreur revient, rejoue une partie.",
      en: "The server could not verify this run. Try again; if it fails again, play a new run.",
    },
    offline: {
      fr: "Le classement n'est pas encore ouvert. Ton score reste dans ce navigateur.",
      en: "The leaderboard is not open yet. Your score stays in this browser.",
    },
    network: {
      fr: "Classement injoignable. Réessaie dans un instant.",
      en: "The leaderboard is unreachable. Try again in a moment.",
    },
  },
  loadingScores: { fr: "Chargement du classement…", en: "Loading the leaderboard…" },

  mute: { fr: "Couper le son", en: "Mute" },
  unmute: { fr: "Activer le son", en: "Unmute" },
  clockOff: {
    fr: "Couper le chronomètre des cartes urgentes",
    en: "Turn off the clock on urgent cards",
  },
  clockOn: {
    fr: "Activer le chronomètre des cartes urgentes",
    en: "Turn on the clock on urgent cards",
  },
  language: { fr: "Langue", en: "Language" },
  keyHint: {
    fr: "Astuce : les touches 1 à 9 choisissent une action, Entrée valide.",
    en: "Tip: keys 1 to 9 pick an action, Enter confirms.",
  },
};
