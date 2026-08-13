import { appendFileSync } from "node:fs";

import { Agent, CredentialSession } from "@atproto/api";

import { sexActs } from "../ts/partials/_sextips.js";
import { generateBlueskyTip } from "../ts/lib/blueskyTip.js";
import { postUrlFromAtUri } from "../ts/lib/blueskyLink.js";

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
  console.log(`Posted:`, postUrl);
  console.log(`::notice title=BlueSky: posted::${escapeForWorkflowCommand(`Posted: ${postUrl}`)}`);
  appendSummary(`## ✅ Posted to BlueSky\n\n**[View post](${postUrl})**\n\n> ${tip}`);
}

main().catch((err) => {
  console.error("post-tip failed:", err);
  process.exit(1);
});
