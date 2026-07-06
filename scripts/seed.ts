import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { merchants, cancelGuides } from "../db/schema";

/* ~50 common billers. Guides are seeded for the majors; the rest get a
   generic guide generated from their domain. */
const MERCHANTS: Array<[name: string, domain: string, category: string]> = [
  ["Netflix", "netflix.com", "streaming"],
  ["Spotify", "spotify.com", "music"],
  ["Disney+", "disneyplus.com", "streaming"],
  ["Hulu", "hulu.com", "streaming"],
  ["Max", "max.com", "streaming"],
  ["Amazon Prime", "amazon.com", "shopping"],
  ["YouTube Premium", "youtube.com", "streaming"],
  ["Apple", "apple.com", "platform"],
  ["Apple TV+", "tv.apple.com", "streaming"],
  ["iCloud+", "icloud.com", "storage"],
  ["Google One", "one.google.com", "storage"],
  ["Dropbox", "dropbox.com", "storage"],
  ["Adobe Creative Cloud", "adobe.com", "software"],
  ["Microsoft 365", "microsoft.com", "software"],
  ["Canva", "canva.com", "software"],
  ["Notion", "notion.so", "software"],
  ["Figma", "figma.com", "software"],
  ["GitHub", "github.com", "software"],
  ["ChatGPT Plus", "openai.com", "ai"],
  ["Claude Pro", "anthropic.com", "ai"],
  ["Midjourney", "midjourney.com", "ai"],
  ["NordVPN", "nordvpn.com", "vpn"],
  ["ExpressVPN", "expressvpn.com", "vpn"],
  ["Surfshark", "surfshark.com", "vpn"],
  ["1Password", "1password.com", "security"],
  ["LastPass", "lastpass.com", "security"],
  ["Audible", "audible.com", "media"],
  ["Kindle Unlimited", "amazon.com/kindle", "media"],
  ["Medium", "medium.com", "media"],
  ["Substack", "substack.com", "media"],
  ["The New York Times", "nytimes.com", "news"],
  ["The Washington Post", "washingtonpost.com", "news"],
  ["The Economist", "economist.com", "news"],
  ["LinkedIn Premium", "linkedin.com", "professional"],
  ["Zoom", "zoom.us", "software"],
  ["Slack", "slack.com", "software"],
  ["Duolingo", "duolingo.com", "education"],
  ["Coursera", "coursera.org", "education"],
  ["Skillshare", "skillshare.com", "education"],
  ["MasterClass", "masterclass.com", "education"],
  ["Headspace", "headspace.com", "wellness"],
  ["Calm", "calm.com", "wellness"],
  ["Strava", "strava.com", "fitness"],
  ["Peloton", "onepeloton.com", "fitness"],
  ["Planet Fitness", "planetfitness.com", "fitness"],
  ["Xbox Game Pass", "xbox.com", "gaming"],
  ["PlayStation Plus", "playstation.com", "gaming"],
  ["Nintendo Switch Online", "nintendo.com", "gaming"],
  ["Twitch", "twitch.tv", "gaming"],
  ["Patreon", "patreon.com", "media"],
  ["Crunchyroll", "crunchyroll.com", "streaming"],
];

/* Hand-written guides for the merchants people struggle with most. */
const GUIDES: Record<string, { steps: string[]; url?: string; phone?: string; difficulty: string }> = {
  "netflix.com": {
    steps: ["Sign in at netflix.com", "Open Account", "Under Membership, click Cancel membership", "Confirm — access lasts until the period ends"],
    url: "https://www.netflix.com/cancelplan",
    difficulty: "easy",
  },
  "spotify.com": {
    steps: ["Go to spotify.com/account", "Open Manage your plan", "Click Change plan", "Scroll to Cancel Premium and confirm"],
    url: "https://www.spotify.com/account/subscription/",
    difficulty: "easy",
  },
  "amazon.com": {
    steps: ["Sign in to Amazon", "Open Accounts & Lists → Prime membership", "Click Manage, then End membership", "Ignore the three retention offers and confirm"],
    url: "https://www.amazon.com/mc",
    difficulty: "medium",
  },
  "adobe.com": {
    steps: ["Sign in at account.adobe.com", "Open Plans → Manage plan", "Click Cancel your plan", "Beware: annual plans charge an early-termination fee after 14 days — chat support can sometimes waive it"],
    url: "https://account.adobe.com/plans",
    difficulty: "hard",
  },
  "nytimes.com": {
    steps: ["Sign in and open Account → Subscription overview", "Click Cancel your subscription", "US law lets you cancel online; if chat is forced, say 'cancel' repeatedly", "Screenshot the confirmation"],
    url: "https://myaccount.nytimes.com/seg/subscription",
    phone: "+1-800-698-4637",
    difficulty: "hard",
  },
  "planetfitness.com": {
    steps: ["Planet Fitness requires in-person or certified-mail cancellation", "Visit your home club and fill out the cancellation form, OR", "Send a certified letter to your home club with name, member ID, and signature", "Keep the receipt — charges often continue one more cycle"],
    difficulty: "hard",
  },
  "onepeloton.com": {
    steps: ["Open Account → Membership on the web (not the app)", "Click Manage → Cancel membership", "App-store subscriptions must be cancelled through Apple/Google instead"],
    url: "https://members.onepeloton.com/preferences/subscriptions",
    difficulty: "medium",
  },
  "linkedin.com": {
    steps: ["Click your avatar → Settings & Privacy", "Open Account preferences → Subscriptions", "Manage Premium → Cancel subscription", "Confirm through the two retention screens"],
    url: "https://www.linkedin.com/premium/manage",
    difficulty: "medium",
  },
  "audible.com": {
    steps: ["Sign in on desktop web (not the app)", "Account details → Cancel membership", "Decline the pause/discount offers", "Unused credits vanish — spend them first"],
    url: "https://www.audible.com/account/overview",
    difficulty: "medium",
  },
  "openai.com": {
    steps: ["Sign in at chatgpt.com", "Open Settings → Subscription", "Click Manage → Cancel plan (Stripe portal)", "Confirm; access lasts until the period ends"],
    difficulty: "easy",
  },
};

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL (and ideally DIRECT_URL) in .env.local");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  console.log(`Seeding ${MERCHANTS.length} merchants…`);
  const inserted = await db
    .insert(merchants)
    .values(MERCHANTS.map(([name, domain, category]) => ({ name, domain, category })))
    .onConflictDoNothing({ target: merchants.domain })
    .returning({ id: merchants.id, domain: merchants.domain });

  const byDomain = new Map(inserted.map((m) => [m.domain, m.id]));
  const guideRows = [];
  for (const [domain, id] of byDomain) {
    const g = GUIDES[domain];
    guideRows.push({
      merchantId: id,
      steps: (g?.steps ?? [
        `Sign in to your account at ${domain}`,
        "Open account or billing settings",
        "Find Subscription / Membership and choose Cancel",
        "Save or screenshot the confirmation",
      ]).map((text, i) => ({ step: i + 1, text })),
      url: g?.url,
      phone: g?.phone,
      difficulty: g?.difficulty ?? "easy",
    });
  }
  if (guideRows.length) await db.insert(cancelGuides).values(guideRows);

  console.log(`Done: ${inserted.length} new merchants, ${guideRows.length} guides.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
