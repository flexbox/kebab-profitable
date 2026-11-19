// Creates the one thing the game sells: a kebab, €9, once. Prints the address
// of its Stripe Payment Link, to put in NEXT_PUBLIC_KEBAB_LINK.
//
//   pnpm stripe:link
//
// It reads STRIPE_SECRET_KEY from .env.local. Run it again and it finds what
// it made the first time instead of making it twice. A test key makes a test
// link; a live key makes the real one.

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing. Run `vercel env pull` first.");
  process.exit(1);
}

const PRICE_CENTS = 900; // a kebab at midi, as in src/game/balance.ts
const LOOKUP = "kebab";
const THANKS = "https://kebab-profitable.vercel.app/?merci=kebab";

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

async function price() {
  const found = await stripe("GET", "prices", { lookup_keys: [LOOKUP], active: true });
  if (found.data[0]) return found.data[0];
  const product = await stripe("POST", "products", {
    name: "Un kebab",
    description:
      "Un vrai kebab pour celui qui a fait Kebab Profitable. A real kebab for whoever made Kebab Profitable.",
  });
  return stripe("POST", "prices", {
    product: product.id,
    unit_amount: PRICE_CENTS,
    currency: "eur",
    lookup_key: LOOKUP,
  });
}

async function link(priceId) {
  const links = await stripe("GET", "payment_links", { active: true, limit: 100 });
  const found = links.data.find((l) => l.metadata?.item === LOOKUP);
  if (found) return found;
  return stripe("POST", "payment_links", {
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { item: LOOKUP },
    after_completion: { type: "redirect", redirect: { url: THANKS } },
    // The name on the leaderboard, for whoever wants to be thanked by it.
    custom_fields: [
      {
        key: "pseudo",
        type: "text",
        optional: true,
        label: { type: "custom", custom: "Pseudo" },
        text: { maximum_length: 16 },
      },
    ],
  });
}

const p = await price();
const l = await link(p.id);
console.log(`${l.livemode ? "LIVE" : "TEST"} link: ${l.url}`);
console.log(`\nNEXT_PUBLIC_KEBAB_LINK=${l.url}`);
