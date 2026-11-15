import type { IdeaDef } from "../types";

/**
 * The idea deck. Three are drawn at the start and after each pivot.
 *
 * `price` and `mvp` are visible on the card. How well an idea really sells
 * (its potential) is hidden and re-rolled by the daily seed.
 *
 * churn    added to the monthly churn rate (negative = stickier)
 * trickle  multiplier on overnight signups
 * burst    multiplier on launch-day signups
 * outreach multiplier on cold outreach
 */
export const IDEAS: IdeaDef[] = [
  // --- signature ideas: the members' real products --------------------------
  {
    id: "app-mobile",
    name: { fr: "App mobile", en: "Mobile app" },
    pitch: {
      fr: "Une app React Native. Deux stores, un seul code, zéro sommeil.",
      en: "A React Native app. Two stores, one codebase, zero sleep.",
    },
    price: 5,
    mvp: 56,
    churn: 0,
    trickle: 1.1,
    burst: 1,
    outreach: 0.5,
    tags: ["mobile"],
    owner: "david",
  },
  {
    id: "vigie",
    name: { fr: "Vigie", en: "Vigie" },
    pitch: {
      fr: "Des agents IA qui disent aux marketplaces quels produits recruter. Peu de clients, de gros contrats.",
      en: "AI agents that tell marketplaces which products to recruit. Few customers, big contracts.",
    },
    price: 99,
    mvp: 104,
    churn: -0.05,
    trickle: 0.9,
    burst: 0.8,
    outreach: 1.6,
    tags: ["b2b", "ai"],
    owner: "karl",
  },
  {
    id: "scrybecast",
    name: { fr: "Scrybecast", en: "Scrybecast" },
    pitch: {
      fr: "Transforme chaque podcast en semaines de contenu.",
      en: "Turns every podcast into weeks of content.",
    },
    price: 15,
    mvp: 72,
    churn: 0,
    trickle: 1,
    burst: 1.1,
    outreach: 1,
    tags: ["ai", "content"],
    owner: "mickael",
  },
  {
    id: "eanscan",
    name: { fr: "Eanscan", en: "Eanscan" },
    pitch: {
      fr: "Une API de fiches produit. Un code-barres entre, une fiche sort.",
      en: "A product sheet API. A barcode goes in, a sheet comes out.",
    },
    price: 29,
    mvp: 64,
    churn: -0.03,
    trickle: 0.9,
    burst: 0.8,
    outreach: 1.3,
    tags: ["b2b"],
    owner: "christophe",
  },
  {
    id: "ekklo",
    name: { fr: "Ekklo", en: "Ekklo" },
    pitch: {
      fr: "Une app mobile à séries. Douze jours d'affilée, qui dit mieux ?",
      en: "A mobile app built on streaks. Twelve days in a row, any advance?",
    },
    price: 4,
    mvp: 48,
    churn: 0.02,
    trickle: 1.2,
    burst: 1.1,
    outreach: 0.4,
    tags: ["mobile"],
    owner: "matthys",
  },

  // --- the classics of the scene ---------------------------------------------
  {
    id: "wrapper-ia",
    name: { fr: "Wrapper IA", en: "AI wrapper" },
    pitch: {
      fr: "Un champ de texte posé sur le modèle de quelqu'un d'autre. Vite fait, vite copié.",
      en: "A text box on top of someone else's model. Quick to build, quick to copy.",
    },
    price: 19,
    mvp: 32,
    churn: 0.08,
    trickle: 1,
    burst: 1.3,
    outreach: 0.8,
    tags: ["ai"],
  },
  {
    id: "boilerplate",
    name: { fr: "Boilerplate", en: "Boilerplate" },
    pitch: {
      fr: "Vendre des pelles aux chercheurs d'or. Auth, paiement, page d'accueil.",
      en: "Selling shovels to gold diggers. Auth, payments, landing page.",
    },
    price: 12,
    mvp: 40,
    churn: 0.04,
    trickle: 1,
    burst: 1.2,
    outreach: 0.7,
    tags: [],
  },
  {
    id: "annuaire",
    name: { fr: "Annuaire", en: "Directory" },
    pitch: {
      fr: "Une liste de liens avec un bouton « Mettre en avant ». Le SEO fera le reste, un jour.",
      en: "A list of links with a “Get featured” button. SEO will do the rest, one day.",
    },
    price: 8,
    mvp: 28,
    churn: 0,
    trickle: 1.3,
    burst: 0.6,
    outreach: 0.9,
    tags: ["content"],
  },
  {
    id: "newsletter",
    name: { fr: "Newsletter payante", en: "Paid newsletter" },
    pitch: {
      fr: "Tes pensées du dimanche, facturées au mois.",
      en: "Your Sunday thoughts, billed monthly.",
    },
    price: 6,
    mvp: 16,
    churn: 0.02,
    trickle: 1.2,
    burst: 0.9,
    outreach: 0.5,
    tags: ["content"],
  },
  {
    id: "extension-chrome",
    name: { fr: "Extension Chrome", en: "Chrome extension" },
    pitch: {
      fr: "Un bouton de plus dans un navigateur qui en a déjà trop.",
      en: "One more button in a browser that already has too many.",
    },
    price: 5,
    mvp: 32,
    churn: 0.03,
    trickle: 1.1,
    burst: 1,
    outreach: 0.5,
    tags: [],
  },
  {
    id: "template-notion",
    name: { fr: "Template Notion", en: "Notion template" },
    pitch: {
      fr: "Un tableau de bord pour organiser sa vie. Fait en une soirée, oublié en un mois.",
      en: "A dashboard to organise your life. Built in an evening, forgotten in a month.",
    },
    price: 9,
    mvp: 16,
    churn: 0.1,
    trickle: 0.9,
    burst: 1.2,
    outreach: 0.5,
    tags: ["content"],
  },
  {
    id: "photos-ia",
    name: { fr: "Générateur de photos IA", en: "AI photo generator" },
    pitch: {
      fr: "Des portraits de pro sans photographe. Les clients repartent dès qu'ils ont leur photo.",
      en: "Pro headshots without a photographer. Customers leave as soon as they have their photo.",
    },
    price: 25,
    mvp: 48,
    churn: 0.15,
    trickle: 1,
    burst: 1.5,
    outreach: 0.6,
    tags: ["ai"],
  },
  {
    id: "job-board",
    name: { fr: "Job board", en: "Job board" },
    pitch: {
      fr: "Des offres d'emploi pour une niche. Ce sont les entreprises qui paient, quand elles paient.",
      en: "Job ads for a niche. Companies pay, when they pay.",
    },
    price: 49,
    mvp: 44,
    churn: 0.05,
    trickle: 0.7,
    burst: 0.7,
    outreach: 1.5,
    tags: ["b2b"],
  },
  {
    id: "formation",
    name: { fr: "Formation en ligne", en: "Online course" },
    pitch: {
      fr: "« Comment j'ai gagné 0 € en ligne », en douze modules.",
      en: "“How I made €0 online”, in twelve modules.",
    },
    price: 39,
    mvp: 56,
    churn: 0.06,
    trickle: 0.8,
    burst: 1.4,
    outreach: 0.7,
    tags: ["content"],
  },
  {
    id: "facturation",
    name: { fr: "SaaS de facturation électronique", en: "E-invoicing SaaS" },
    pitch: {
      fr: "La réforme rend la facture électronique obligatoire. Long à construire, mais personne ne résilie.",
      en: "The reform makes e-invoicing mandatory in France. Slow to build, but nobody cancels.",
    },
    price: 22,
    mvp: 96,
    churn: -0.06,
    trickle: 0.8,
    burst: 0.6,
    outreach: 1.4,
    tags: ["b2b"],
  },
];

export function idea(id: string): IdeaDef {
  const found = IDEAS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown idea: ${id}`);
  return found;
}
