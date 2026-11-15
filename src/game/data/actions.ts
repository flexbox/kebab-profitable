import type { ActionDef, ActionId } from "../types";

/** What a slot can hold. `energie` is the cost (negative) or gain. */
export const ACTIONS: ActionDef[] = [
  {
    id: "coder",
    name: { fr: "Coder", en: "Code" },
    desc: {
      fr: "Fait avancer le MVP, puis prépare les mises à jour.",
      en: "Moves the MVP forward, then prepares updates.",
    },
    key: "1",
    energie: -12,
    work: true,
  },
  {
    id: "shipper",
    name: { fr: "Shipper", en: "Ship" },
    desc: {
      fr: "Lance le MVP ou une mise à jour : une vague d'inscriptions.",
      en: "Launches the MVP or an update: a burst of signups.",
    },
    key: "2",
    energie: -10,
    work: true,
  },
  {
    id: "poster",
    name: { fr: "Poster", en: "Post" },
    desc: {
      fr: "Build in public : fait grandir l'audience.",
      en: "Build in public: grows your audience.",
    },
    key: "3",
    energie: -8,
    work: true,
  },
  {
    id: "demarcher",
    name: { fr: "Démarcher", en: "Outreach" },
    desc: {
      fr: "Écrire à des inconnus. Une chance de client tout de suite.",
      en: "Writing to strangers. A chance at a customer right now.",
    },
    key: "4",
    energie: -10,
    work: true,
  },
  {
    id: "support",
    name: { fr: "Support", en: "Support" },
    desc: {
      fr: "Répondre aux utilisateurs : moins de churn en fin de mois.",
      en: "Answering users: less churn at month-end.",
    },
    key: "5",
    energie: -7,
    work: true,
  },
  {
    id: "freelance",
    name: { fr: "Freelance", en: "Freelance" },
    desc: {
      fr: "De l'argent aujourd'hui. Aucun progrès, et le moral en prend un coup.",
      en: "Money today. No progress, and morale takes a hit.",
    },
    key: "6",
    energie: -14,
    work: true,
  },
  {
    id: "repos",
    name: { fr: "Se reposer", en: "Rest" },
    desc: {
      fr: "Recharge l'énergie et le moral.",
      en: "Restores energy and morale.",
    },
    key: "7",
    energie: 0,
    work: false,
  },
  {
    id: "pivoter",
    name: { fr: "Pivoter", en: "Pivot" },
    desc: {
      fr: "Abandonne le projet et tire trois nouvelles idées. L'audience reste, le reste de la journée y passe.",
      en: "Drops the project and draws three new ideas. The audience stays, the rest of the day goes.",
    },
    key: "8",
    energie: -5,
    work: true,
  },
  {
    id: "apero",
    name: { fr: "Apéro", en: "Apéro" },
    desc: {
      fr: "L'apéro mensuel des Indie Hackers Lille au Charlatan. Du moral, et peut-être une intro.",
      en: "The monthly Indie Hackers Lille drinks at Le Charlatan. Morale, and maybe an intro.",
    },
    key: "9",
    energie: -4,
    work: false,
  },
];

export function action(id: ActionId): ActionDef {
  const found = ACTIONS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown action: ${id}`);
  return found;
}
