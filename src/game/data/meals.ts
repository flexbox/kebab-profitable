import type { MealDef, MealId } from "../types";

/** The midi meal: a free pick each day that costs no slot. */
export const MEALS: MealDef[] = [
  {
    id: "skip",
    name: { fr: "Sauter le repas", en: "Skip lunch" },
    price: 0,
    faim: 0,
    moral: 0,
    desc: {
      fr: "Gratuit. La faim se vide vite.",
      en: "Free. Hunger empties fast.",
    },
  },
  {
    id: "pates",
    name: { fr: "Pâtes au beurre", en: "Buttered pasta" },
    price: 1,
    faim: 38,
    moral: -3,
    desc: {
      fr: "Ça cale, mais ça ne fait pas rêver.",
      en: "Filling, not thrilling.",
    },
  },
  {
    id: "kebab",
    name: { fr: "Kebab", en: "Kebab" },
    price: 9,
    faim: 50,
    moral: 4,
    desc: {
      fr: "L'unité de mesure officielle de la rentabilité.",
      en: "The official unit of profitability.",
    },
  },
  {
    id: "welsh",
    name: { fr: "Welsh", en: "Welsh" },
    price: 16,
    faim: 70,
    moral: 10,
    sluggish: 0.7,
    desc: {
      fr: "Cheddar fondu à la bière. Grand moral, après-midi au ralenti.",
      en: "Cheddar melted in beer. Great for morale, slow afternoon.",
    },
  },
];

export function meal(id: MealId): MealDef {
  const found = MEALS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown meal: ${id}`);
  return found;
}
