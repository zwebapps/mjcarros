import assert from "node:assert/strict";

import { CLIENT_VISIBLE_PRODUCT_FILTER, isProductHidden } from "@/lib/product-visibility";
import { getTokenFromCookie } from "@/lib/auth-cookie";
import { markdownToPlainText, truncateAtWord } from "@/lib/plain-text";

function test(name: string, fn: () => void) {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`✓ ${name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`✗ ${name}`);
    throw err;
  }
}

test("CLIENT_VISIBLE_PRODUCT_FILTER excludes hidden === true", () => {
  assert.deepEqual(CLIENT_VISIBLE_PRODUCT_FILTER, { hidden: false });
});

test("isProductHidden returns true only for hidden === true", () => {
  assert.equal(isProductHidden({ hidden: true }), true);
  assert.equal(isProductHidden({ hidden: false }), false);
  assert.equal(isProductHidden({}), false);
  assert.equal(isProductHidden(null), false);
  assert.equal(isProductHidden(undefined), false);
  assert.equal(isProductHidden({ hidden: "true" }), false);
});

test("getTokenFromCookie extracts authToken value", () => {
  assert.equal(getTokenFromCookie(null), null);
  assert.equal(getTokenFromCookie("foo=bar"), null);
  assert.equal(getTokenFromCookie("authToken=abc123"), "abc123");
  assert.equal(getTokenFromCookie("foo=bar; authToken=abc123; baz=1"), "abc123");
});


test("markdownToPlainText strips markdown for link previews", () => {
  const md = "**Mercedes-Benz EQB 250+ AMG Line**\n\n- 📝 2025 fully _electric_ SUV\n- [Book a test drive](https://x.pt)";
  assert.equal(
    markdownToPlainText(md),
    "Mercedes-Benz EQB 250+ AMG Line 📝 2025 fully electric SUV Book a test drive"
  );
});

test("truncateAtWord cuts on a word boundary with an ellipsis", () => {
  assert.equal(truncateAtWord("one two three four", 12), "one two…");
  assert.equal(truncateAtWord("short", 160), "short");
});
