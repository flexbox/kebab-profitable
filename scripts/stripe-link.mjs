// Creates what the game sells, and prints the address of each Stripe Payment
// Link with the variable to put it in:
//
//   a kebab, €9, once                        NEXT_PUBLIC_KEBAB_LINK
//   a founder card of your own, €27, once    NEXT_PUBLIC_FOUNDER_LINK
//
//   pnpm stripe:link
//
// It reads STRIPE_SECRET_KEY from .env.local, unless one is already set in the
// shell. Run it again and it finds what it made the first time instead of
// making it twice. A test key makes test links; a live key makes the real ones.

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing. Run `vercel env pull` first.");
  process.exit(1);
}

const SITE = "https://kebab-profitable.vercel.app";

/** A text field on the checkout page. Stripe allows three. */
const field = (key, label, max, optional) => ({
  key,
  type: "text",
  optional,
  label: { type: "custom", custom: label },
  text: { maximum_length: max },
});

const ITEMS = [
  {
    key: "kebab",
    env: "NEXT_PUBLIC_KEBAB_LINK",
    cents: 900, // a kebab at midi, as in src/game/balance.ts
    name: "Un kebab",
    description:
      "Un vrai kebab pour celui qui a fait Kebab Profitable. A real kebab for whoever made Kebab Profitable.",
    // The name on the leaderboard, for whoever wants to be thanked by it.
    fields: [field("pseudo", "Pseudo", 16, true)],
  },
  {
    key: "fondateur",
    env: "NEXT_PUBLIC_FOUNDER_LINK",
    cents: 2700, // three kebabs
    name: "Ta carte de fondateur",
    description:
      "Ton portrait en pixel art et ta carte jouable dans Kebab Profitable. Your pixel-art portrait and your playable card in Kebab Profitable.",
    // Enough to start drawing; the perk and the flaw are settled by e-mail.
    fields: [field("nom", "Nom sur la carte / Name on the card", 40, false), field("x", "Compte X", 30, true)],
  },
];

/** Stripe takes forms, with nested keys written a[b][c]. */
function form(value, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(value)) {
    const name = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === "object") form(v, name, out);
    else out.append(name, String(v));
  }
  return out;
}

async function stripe(method, path, body) {
  const query = method === "GET" && body ? `?${form(body)}` : "";
  const res = await fetch(`https://api.stripe.com/v1/${path}${query}`, {
    method,
    headers: { Authorization: `Bearer ${key}` },
    body: method === "POST" ? form(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

async function price(item) {
  const found = await stripe("GET", "prices", { lookup_keys: [item.key], active: true });
  if (found.data[0]) return found.data[0];
  const product = await stripe("POST", "products", {
    name: item.name,
    description: item.description,
  });
  return stripe("POST", "prices", {
    product: product.id,
    unit_amount: item.cents,
    currency: "eur",
    lookup_key: item.key,
  });
}

async function link(item, priceId, existing) {
  const found = existing.find((l) => l.metadata?.item === item.key);
  if (found) return found;
  return stripe("POST", "payment_links", {
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { item: item.key },
    // Back to the title, where Chef says thank you.
    after_completion: { type: "redirect", redirect: { url: `${SITE}/?merci=${item.key}` } },
    custom_fields: item.fields,
  });
}

const existing = (await stripe("GET", "payment_links", { active: true, limit: 100 })).data;
for (const item of ITEMS) {
  const p = await price(item);
  const l = await link(item, p.id, existing);
  console.log(`${l.livemode ? "LIVE" : "TEST"}  ${item.env}=${l.url}`);
}
