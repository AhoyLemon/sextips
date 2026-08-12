import { appendFileSync } from "node:fs";

import { Agent, CredentialSession } from "@atproto/api";

import { sexActs } from "../ts/partials/_sextips.js";
import { generateBlueskyTip } from "../ts/lib/blueskyTip.js";
import { postUrlFromAtUri } from "../ts/lib/blueskyLink.js";
import { countPostsToday, deriveTicksSinceLastPost, rollShouldPost, DAILY_CAP } from "../ts/lib/postSchedule.js";

/**
 * Writes to the GitHub Actions job summary (rendered prominently at the top
 * of a run's page) so the outcome is visible without opening step logs.
 * No-ops outside of Actions, where GITHUB_STEP_SUMMARY isn't set.
 */
function appendSummary(markdown: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${markdown}\n`);
}

/** Escapes a message for use in a GitHub Actions workflow command (::notice::/::warning::). */
function escapeForWorkflowCommand(message: string): string {
  return message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

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
    const message = `Daily cap reached (${postsToday}/${DAILY_CAP} posts today); skipping.`;
    console.log(message);
    console.log(`::notice title=BlueSky: skipped::${escapeForWorkflowCommand(message)}`);
    appendSummary(`## ⏭️ Skipped — daily cap reached\n\n${postsToday}/${DAILY_CAP} posts already landed today (UTC).`);
    return;
  }

  const ticksSinceLastPost = deriveTicksSinceLastPost(postTimestamps, now);
  if (!rollShouldPost(ticksSinceLastPost)) {
    const message = `Roll failed at ${ticksSinceLastPost} ticks since last post; skipping.`;
    console.log(message);
    console.log(`::notice title=BlueSky: skipped::${escapeForWorkflowCommand(message)}`);
    appendSummary(
      `## ⏭️ Skipped — roll failed\n\n${ticksSinceLastPost} ticks since the last post (${postsToday}/${DAILY_CAP} posts today). Re-run to roll again.`
    );
    return;
  }

  const tip = generateBlueskyTip(sexActs);
  if (!tip) {
    const message = "Could not generate a tip under the grapheme limit within the attempt cap; skipping this tick.";
    console.warn(message);
    console.log(`::warning title=BlueSky: skipped::${escapeForWorkflowCommand(message)}`);
    appendSummary(`## ⚠️ Skipped — tip generation exhausted its attempt cap\n\nEvery generated tip exceeded the 300-grapheme limit.`);
    return;
  }

  const result = await agent.post({ text: tip });
  const postUrl = postUrlFromAtUri(result.uri, did);
  console.log(`Posted (${postsToday + 1}/${DAILY_CAP} today, ${ticksSinceLastPost} ticks since prior post):`, postUrl);
  console.log(`::notice title=BlueSky: posted::${escapeForWorkflowCommand(`Posted: ${postUrl}`)}`);
  appendSummary(
    `## ✅ Posted to BlueSky\n\n**[View post](${postUrl})**\n\n> ${tip}\n\n${postsToday + 1}/${DAILY_CAP} posts today, ${ticksSinceLastPost} ticks since the prior post.`
  );
}

main().catch((err) => {
  console.error("post-tip failed:", err);
  process.exit(1);
});
