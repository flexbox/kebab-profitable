import type { L, Potential } from "./types";

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

/** Everything the engine writes to the log, in both languages. */
export const M = {
  intro: (): L => ({
    fr: "1er janvier 2027. Hier, tu as signé ta rupture conventionnelle. Aujourd'hui, tu es indie hacker.",
    en: "1 January 2027. Yesterday you signed your way out of your job. Today you are an indie hacker.",
  }),
  ideaPicked: (name: L): L => ({
    fr: `Nouveau projet : ${name.fr}.`,
    en: `New project: ${name.en}.`,
  }),
  coded: (pct: number): L => ({
    fr: `Tu codes. MVP à ${pct} %.`,
    en: `You code. MVP at ${pct}%.`,
  }),
  mvpReady: (): L => ({
    fr: "Tu codes. Le MVP est prêt : il ne reste qu'à shipper.",
    en: "You code. The MVP is ready: all that's left is to ship.",
  }),
  codedUpdate: (built: number, needed: number): L =>
    built >= needed
      ? {
          fr: "Tu codes la suite. Une mise à jour est prête à shipper.",
          en: "You code what's next. An update is ready to ship.",
        }
      : {
          fr: "Tu codes la suite. Encore un peu avant de pouvoir shipper une mise à jour.",
          en: "You code what's next. A little more before an update can ship.",
        },
  shiny: (): L => ({
    fr: "Tu réécris toute la stack avec un framework sorti hier. Aucun progrès, mais quel plaisir.",
    en: "You rewrite the whole stack with a framework released yesterday. No progress, but what a joy.",
  }),
  launched: (n: number): L =>
    n > 0
      ? {
          fr: `Lancement ! ${n} ${plural(n, "inscription", "inscriptions")} le jour même.`,
          en: `Launch! ${n} ${plural(n, "signup", "signups")} on day one.`,
        }
      : {
          fr: "Lancement ! Personne ne s'inscrit. Le silence est assourdissant.",
          en: "Launch! Nobody signs up. The silence is deafening.",
        },
  launchInReview: (): L => ({
    fr: "Envoyé à l'App Store. Verdict demain, si tout va bien.",
    en: "Submitted to the App Store. Verdict tomorrow, if all goes well.",
  }),
  launchSalesCycle: (days: number): L => ({
    fr: `C'est lancé. Les prospects « reviennent vers toi » : réponse dans ${days} jours.`,
    en: `It's live. Prospects will “circle back”: answer in ${days} days.`,
  }),
  pendingLanded: (n: number): L =>
    n > 0
      ? {
          fr: `Les inscriptions du lancement arrivent : ${n}.`,
          en: `The launch signups come in: ${n}.`,
        }
      : {
          fr: "Les résultats du lancement arrivent : zéro inscription.",
          en: "The launch results come in: zero signups.",
        },
  verdict: (p: Potential): L =>
    [
      {
        fr: "Verdict du marché : un flop. Personne n'attendait ça.",
        en: "The market's verdict: a flop. Nobody was waiting for this.",
      },
      {
        fr: "Verdict du marché : tiède. Quelques curieux, pas plus.",
        en: "The market's verdict: lukewarm. A few curious people, no more.",
      },
      {
        fr: "Verdict du marché : correct. Il y a un public.",
        en: "The market's verdict: decent. There is an audience for it.",
      },
      {
        fr: "Verdict du marché : ça prend bien.",
        en: "The market's verdict: it's catching on.",
      },
      {
        fr: "Verdict du marché : une pépite. Ne lâche rien.",
        en: "The market's verdict: a gem. Don't let go.",
      },
    ][p],
  updateShipped: (n: number, quality: number): L => ({
    fr: `Mise à jour en ligne. Qualité ${quality}/100, ${n} ${plural(n, "inscription", "inscriptions")}.`,
    en: `Update live. Quality ${quality}/100, ${n} ${plural(n, "signup", "signups")}.`,
  }),
  posted: (gain: number): L => ({
    fr: `Tu postes. +${gain} abonnés.`,
    en: `You post. +${gain} followers.`,
  }),
  postedViral: (gain: number): L => ({
    fr: `Ton post s'envole : +${gain} abonnés.`,
    en: `Your post takes off: +${gain} followers.`,
  }),
  outreachWin: (): L => ({
    fr: "Une réponse positive : un client de plus.",
    en: "A positive reply: one more customer.",
  }),
  outreachFail: (): L => ({
    fr: "Quarante messages envoyés. Une seule réponse : « désabonnez-moi ».",
    en: "Forty messages sent. One reply: “unsubscribe me”.",
  }),
  waitlist: (gain: number): L => ({
    fr: `Tu démarches avant le lancement : +${gain} curieux sur la liste d'attente.`,
    en: `You do outreach before launch: +${gain} curious people on the waitlist.`,
  }),
  supportDone: (): L => ({
    fr: "Tu réponds à tout le monde. Les clients s'en souviendront à la fin du mois.",
    en: "You answer everyone. Customers will remember at month-end.",
  }),
  freelanceDone: (pay: number): L => ({
    fr: `Mission freelance : +${pay} €. Tu as centré une div pour quelqu'un d'autre.`,
    en: `Freelance gig: +€${pay}. You centred a div for someone else.`,
  }),
  rested: (): L => ({
    fr: "Tu souffles un peu.",
    en: "You catch your breath.",
  }),
  pivoted: (name: L): L => ({
    fr: `Tu abandonnes ${name.fr}. Page blanche.`,
    en: `You drop ${name.en}. Blank page.`,
  }),
  pivotedFree: (name: L): L => ({
    fr: `Tu abandonnes ${name.fr} sans y laisser ta journée.`,
    en: `You drop ${name.en} without losing your day.`,
  }),
  apero: (): L => ({
    fr: "Apéro au Charlatan. Zéro slide, 100 % concret.",
    en: "Apéro at Le Charlatan. No slides, all substance.",
  }),
  introAudience: (gain: number): L => ({
    fr: `On te présente quelqu'un qui parle de toi autour de lui : +${gain} abonnés.`,
    en: `Someone you are introduced to spreads the word: +${gain} followers.`,
  }),
  introCustomer: (): L => ({
    fr: "On te présente quelqu'un, qui s'abonne dans la foulée.",
    en: "You are introduced to someone, who subscribes on the spot.",
  }),
  slotLost: (): L => ({ fr: "Créneau perdu.", en: "Slot lost." }),
  coffee: (): L => ({
    fr: "« Un café ? » Tu n'as pas su dire non. L'après-midi y passe.",
    en: "“Coffee?” You couldn't say no. There goes the afternoon.",
  }),
  mealEaten: (name: L, price: number): L => ({
    fr: price > 0 ? `Midi : ${name.fr.toLowerCase()} (${price} €).` : "Midi : rien.",
    en: price > 0 ? `Lunch: ${name.en.toLowerCase()} (€${price}).` : "Lunch: nothing.",
  }),
  nightSignups: (n: number): L => ({
    fr: `Cette nuit : ${n} ${plural(n, "nouveau client", "nouveaux clients")}.`,
    en: `Overnight: ${n} new ${plural(n, "customer", "customers")}.`,
  }),
  lostDayEnergy: (): L => ({
    fr: "Épuisé. Tu passes la journée au lit.",
    en: "Exhausted. You spend the day in bed.",
  }),
  lostDayMoral: (): L => ({
    fr: "Le moral à zéro. Tu passes la journée devant des séries.",
    en: "Morale at rock bottom. You spend the day watching series.",
  }),
  away: (): L => ({
    fr: "Jour de retreat. Aucun écran en vue.",
    en: "Retreat day. No screen in sight.",
  }),
  monthEnd: (net: number): L => ({
    fr:
      net >= 0
        ? `Fin du mois : +${net} € une fois le loyer et l'URSSAF payés.`
        : `Fin du mois : ${net} € une fois le loyer et l'URSSAF payés.`,
    en:
      net >= 0
        ? `Month-end: +€${net} after rent and URSSAF.`
        : `Month-end: -€${Math.abs(net)} after rent and URSSAF.`,
  }),
  churned: (n: number): L => ({
    fr: `${n} ${plural(n, "client résilie", "clients résilient")}.`,
    en: `${n} ${plural(n, "customer cancels", "customers cancel")}.`,
  }),
  sold: (cash: number): L => ({
    fr: `Projet vendu : +${cash} €.`,
    en: `Project sold: +€${cash}.`,
  }),
  won: (mrr: number): L => ({
    fr: `${mrr} € de MRR. Kebab profitable !`,
    en: `€${mrr} of MRR. Kebab profitable!`,
  }),
  lostCash: (): L => ({
    fr: "Compte à zéro. Tu rouvres LinkedIn.",
    en: "Balance at zero. You reopen LinkedIn.",
  }),
  lostCdi: (): L => ({
    fr: "Tu signes le CDI. Le side-project attendra la retraite.",
    en: "You sign the contract. The side project can wait for retirement.",
  }),
};

/** Why an action is unavailable. */
export const WHY = {
  mvpNotReady: (): L => ({
    fr: "Le MVP n'est pas fini.",
    en: "The MVP is not finished.",
  }),
  nothingToShip: (): L => ({
    fr: "Rien de nouveau à shipper : code d'abord.",
    en: "Nothing new to ship: code first.",
  }),
  inReview: (): L => ({
    fr: "Le lancement est en attente de résultats.",
    en: "The launch is waiting for results.",
  }),
  noCustomers: (): L => ({
    fr: "Pas encore de clients à qui répondre.",
    en: "No customers to answer yet.",
  }),
  notAperoDay: (days: number): L => ({
    fr: days > 0 ? `Prochain apéro dans ${days} j.` : "L'apéro, c'est ce soir.",
    en: days > 0 ? `Next apéro in ${days}d.` : "The apéro is tonight.",
  }),
  noBudget: (): L => ({
    fr: "Ton seul client n'a plus de budget ce mois-ci.",
    en: "Your one client has no budget left this month.",
  }),
  noCash: (): L => ({
    fr: "Pas assez d'argent.",
    en: "Not enough money.",
  }),
};
