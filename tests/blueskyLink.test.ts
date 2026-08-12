import { describe, expect, test } from "bun:test";

import { postUrlFromAtUri } from "../ts/lib/blueskyLink";

describe("postUrlFromAtUri", () => {
  test("builds a bsky.app profile/post link from an AT-URI and DID", () => {
    const uri = "at://did:plc:abc123/app.bsky.feed.post/xyz789";
    expect(postUrlFromAtUri(uri, "did:plc:abc123")).toBe(
      "https://bsky.app/profile/did:plc:abc123/post/xyz789"
    );
  });
});
