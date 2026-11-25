import type { EventDef } from "../types";

/**
 * The cards of the apéro. Every evening at the bar deals one, in place of
 * anything urgent: at a table of indie hackers, somebody always has a deal for
 * you. They are never drawn overnight.
 *
 * The first apéro of a run is hosted by Indie Hackers. After that, the card is
 * drawn from the others, those not met yet first.
 *
 * House rules:
 *  - it happens at the bar, between two drinks: an offer, a tip, a bet;
 *  - one choice is the deal, the other lets it go, and letting it go is never
 *    a punishment;
 *  - a choice that costs money needs a `minCash` guard;
 *  - a member who gives the advice is never the founder playing: see
 *    `notFounder`;
 *  - cameos follow the house rules at the top of `events.ts`.
 */
export const APERO_HOST = "ih-apero";

export const APERO_CARDS: EventDef[] = [
  {
    id: APERO_HOST,
    kind: "cameo",
    tone: "good",
    who: "ih",
    title: { fr: "Apéro Indie Hackers", en: "Indie Hackers apéro" },
    text: {
      fr: "Entre deux verres, quelqu'un d'Indie Hackers te demande où tu en es. Pas le pitch : les chiffres, et ce qui coince.",
      en: "Between two drinks, someone from Indie Hackers asks where you stand. Not the pitch: the numbers, and what is stuck.",
    },
    choices: [
      {
        label: {
          fr: "Tout dire, chiffres compris",
          en: "Tell it all, numbers included",
        },
        outcomes: [
          {
            effect: { audience: 20, socialMoral: 4 },
            text: {
              fr: "Tu donnes ton MRR, ton churn et ce qui bloque. Trois personnes ont une idée, une a un contact. La meilleure heure du mois.",
              en: "You give your MRR, your churn and what is blocking you. Three people have an idea, one has a contact. Best hour of the month.",
            },
          },
        ],
      },
      {
        label: { fr: "Sortir le pitch", en: "Give the pitch" },
        outcomes: [
          {
            effect: { moral: 2 },
            text: {
              fr: "Ton pitch est parfait. Tout le monde hoche la tête poliment et retourne parler de ses vrais chiffres.",
              en: "Your pitch is flawless. Everyone nods politely and goes back to talking about their real numbers.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "apero-bootcamp",
    kind: "apero",
    tone: "neutral",
    title: { fr: "Le bootcamp vente", en: "The sales bootcamp" },
    text: {
      fr: "Au comptoir, quelqu'un ne jure que par un bootcamp vente : six semaines, 150 €, « ça a changé ma vie ». Le lien est déjà sur son téléphone.",
      en: "At the bar, someone swears by a sales bootcamp: six weeks, €150, “it changed my life”. The link is already on their phone.",
    },
    choices: [
      {
        label: { fr: "S'inscrire (150 €)", en: "Sign up (€150)" },
        when: { minCash: 150 },
        outcomes: [
          {
            effect: { cash: -150, customers: 2, boost: { mult: 1.5, days: 14 }, moral: 4 },
            text: {
              fr: "Bingo : six semaines d'AARRR, de l'acquisition à la recommandation. Tu repars avec un tunnel qui convertit enfin, et deux clients pour le prouver.",
              en: "Bingo: six weeks of AARRR, from acquisition to referral. You come out with a funnel that finally converts, and two customers to prove it.",
            },
          },
          {
            effect: { cash: -150, moral: -6, skipSlots: 1 },
            text: {
              fr: "Raté : six semaines pour apprendre à faire un deck pour investisseurs. Tu n'as pas d'investisseurs. Tu as un très beau slide 12.",
              en: "Miss: six weeks on building a deck for investors. You have no investors. You do have a lovely slide 12.",
            },
          },
        ],
      },
      {
        label: { fr: "Garder ses 150 €", en: "Keep your €150" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tu notes le lien quelque part. Tu ne le retrouveras jamais.",
              en: "You save the link somewhere. You will never find it again.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "apero-raycast",
    kind: "cameo",
    tone: "good",
    who: "raycast",
    title: { fr: "Le raccourci de David", en: "David's shortcut" },
    text: {
      fr: "Entre deux verres, David ouvre son Mac : Raycast, un raccourci, et toute sa journée tient sur le clavier. Démo en dix secondes.",
      en: "Between two drinks, David opens a laptop: Raycast, one shortcut, and a whole day fits on the keyboard. Demo in ten seconds.",
    },
    // Not when David is the one playing: Raycast is already David's own perk.
    when: { notFounder: "david" },
    choices: [
      {
        label: { fr: "Installer Raycast", en: "Install Raycast" },
        outcomes: [
          {
            effect: { built: 3, energie: 5 },
            text: {
              fr: "Tu mets tes trois tâches les plus répétées derrière un raccourci. Le lendemain, tu codes plus et tu cliques moins.",
              en: "You put your three most repeated tasks behind a shortcut. The next day you code more and click less.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester sur Spotlight", en: "Stick with Spotlight" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "David soupire. Tu ouvres le Finder pour chercher ce que tu cherchais.",
              en: "David sighs. You open Finder to look for whatever you were looking for.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "apero-beta",
    kind: "apero",
    tone: "good",
    title: { fr: "Échange de bêta", en: "Beta swap" },
    text: {
      fr: "À ta gauche, on te propose un deal : on teste ton produit ce soir si tu testes le sien. Téléphones sur la table.",
      en: "The person on your left offers a deal: they test your product tonight if you test theirs. Phones on the table.",
    },
    when: { hasProject: true },
    choices: [
      {
        label: { fr: "Tope là", en: "Deal" },
        outcomes: [
          {
            effect: { quality: 6, built: 2 },
            text: {
              fr: "Douze bugs en vingt minutes, dont un sur la page de paiement. Ça pique, et ça répare.",
              en: "Twelve bugs in twenty minutes, one of them on the checkout page. It stings, and it fixes.",
            },
          },
        ],
      },
      {
        label: { fr: "Pas ce soir", en: "Not tonight" },
        outcomes: [
          {
            effect: {},
            text: {
              fr: "Tu gardes tes bugs pour toi. Tes utilisateurs les trouveront.",
              en: "You keep your bugs to yourself. Your users will find them.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "apero-gig",
    kind: "apero",
    tone: "neutral",
    title: { fr: "La mission du week-end", en: "The weekend gig" },
    text: {
      fr: "Quelqu'un cherche « juste une landing page » pour lundi. 400 €, payés à la livraison. Ton week-end vient de recevoir une offre.",
      en: "Someone needs “just a landing page” by Monday. €400, paid on delivery. Your weekend just got an offer.",
    },
    choices: [
      {
        label: { fr: "Accepter", en: "Take it" },
        outcomes: [
          {
            p: 3,
            effect: { cash: 400, skipSlots: 2, energie: -10 },
            text: {
              fr: "Livrée lundi 8 h. Le client demande « juste une petite modif ». Tu factures.",
              en: "Delivered Monday, 8 a.m. The client asks for “just one small change”. You invoice it.",
            },
          },
          {
            effect: { cash: 100, skipSlots: 4, moral: -8 },
            text: {
              fr: "La landing page devient un site de six pages. Tu touches 100 € et une leçon.",
              en: "The landing page turns into a six-page site. You get €100 and a lesson.",
            },
          },
        ],
      },
      {
        label: { fr: "Décliner", en: "Decline" },
        outcomes: [
          {
            effect: { moral: 2 },
            text: {
              fr: "Tu gardes ton week-end pour ton produit. Personne ne te paie pour ça, mais c'est le tien.",
              en: "You keep the weekend for your product. Nobody pays you for that, but it is yours.",
            },
          },
        ],
      },
    ],
  },
];
