import assert from "node:assert/strict";
import test from "node:test";
import { PIP_LAYOUTS, renderCardFace } from "../card-renderer.mjs";

test("number cards have the expected pip counts and mirrored lower pips", () => {
  for (const rank of ["2", "3", "4", "5", "6", "7", "8", "9", "10"]) assert.equal(PIP_LAYOUTS[rank].length, Number(rank));
  assert.equal(PIP_LAYOUTS["4"].filter(pip => pip.flip).length, 2);
  assert.equal(PIP_LAYOUTS["10"].filter(pip => pip.flip).length, 5);
});

test("card faces use reusable SVG suit paths without emoji characters", () => {
  const face = renderCardFace({ rank: "8", suit: "♥" });
  assert.match(face, /card-face-svg/);
  assert.match(face, /suit-heart/);
  assert.doesNotMatch(face, /🂠|♥/);
});

test("court cards have original vector figure markup and indexes", () => {
  const face = renderCardFace({ rank: "K", suit: "♣" });
  assert.match(face, /court-figure/);
  assert.match(face, />K</);
});

test("squeeze progress hides the index until the reveal is nearly complete", () => {
  const early = renderCardFace({ rank: "10", suit: "♦", faceUp: false, squeezeProgress: 40 });
  const late = renderCardFace({ rank: "10", suit: "♦", faceUp: false, squeezeProgress: 80 });
  assert.doesNotMatch(early, />10</);
  assert.match(late, />10</);
});
