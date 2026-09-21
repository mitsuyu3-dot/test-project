import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("squeeze layout keeps candidates outside the clipped card and actions in flow", () => {
  assert.match(html, /squeeze-modal-card[^]*squeeze-candidates[^]*squeeze-modal-actions/);
  assert.match(css, /grid-template-rows: auto auto max-content max-content max-content/);
  assert.match(css, /overflow-y: auto/);
  assert.match(css, /\.squeeze-modal-actions \{[^}]*margin-top: 24px/);
  assert.doesNotMatch(css, /\.squeeze-modal-actions \{[^}]*position:\s*absolute/);
});

test("responsive squeeze layout moves the candidate panel below the card", () => {
  assert.match(css, /@media \(max-width: 600px\)[^]*\.squeeze-candidates \{ max-width: 340px; width: 100%; \}/);
  assert.match(css, /\.squeeze-direction-bottom \.squeeze-modal-stage \{[^}]*grid-template-rows: auto auto/);
});
