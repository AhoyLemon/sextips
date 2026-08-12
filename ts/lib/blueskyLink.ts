/** Builds a bsky.app web link for a post from its AT-URI and the author's DID. */
export function postUrlFromAtUri(uri: string, did: string): string {
  const rkey = uri.split("/").pop();
  return `https://bsky.app/profile/${did}/post/${rkey}`;
}
