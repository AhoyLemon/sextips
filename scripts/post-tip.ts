import { Agent, CredentialSession } from "@atproto/api";

import { sexActs } from "../ts/partials/_sextips.js";
import { generateBlueskyTip } from "../ts/lib/blueskyTip.js";
import { countPostsToday, deriveTicksSinceLastPost, rollShouldPost, DAILY_CAP } from "../ts/lib/postSchedule.js";

async function main(): Promise<void> {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) {
    throw new Error("Missing BLUESKY_IDENTIFIER or BLUESKY_APP_PASSWORD environment variable.");
  }

  const session = new CredentialSession(new URL("https://bsky.social"));
  await session.login({ identifier, password });
  const agent = new Agent(session);

  const did = session.did;
  if (!did) throw new Error("Login succeeded but no session DID was returned.");

  const { data } = await agent.getAuthorFeed({ actor: did, limit: 100 });
  const now = new Date();
  const postTimestamps = data.feed
    .filter((entry) => !entry.reason && entry.post.author.did === did)
    .map((entry) => new Date(entry.post.indexedAt));

  const postsToday = countPostsToday(postTimestamps, now);
  if (postsToday >= DAILY_CAP) {
    console.log(`Daily cap reached (${postsToday}/${DAILY_CAP} posts today); skipping.`);
    return;
  }

  const ticksSinceLastPost = deriveTicksSinceLastPost(postTimestamps, now);
  if (!rollShouldPost(ticksSinceLastPost)) {
    console.log(`Roll failed at ${ticksSinceLastPost} ticks since last post; skipping.`);
    return;
  }

  const tip = generateBlueskyTip(sexActs);
  if (!tip) {
    console.warn("Could not generate a tip under the grapheme limit within the attempt cap; skipping this tick.");
    return;
  }

  const result = await agent.post({ text: tip });
  console.log(`Posted (${postsToday + 1}/${DAILY_CAP} today, ${ticksSinceLastPost} ticks since prior post):`, result.uri);
}

main().catch((err) => {
  console.error("post-tip failed:", err);
  process.exit(1);
});
