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

test("all card ranks keep their pip counts and suit colors inside the card viewBox", () => {
  for (const rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"]) {
    const face = renderCardFace({ rank, suit: "♥" });
    assert.equal((face.match(/suit-heart/g) ?? []).length, PIP_LAYOUTS[rank].length + 3);
    assert.match(face, /viewBox="0 0 100 140"/);
    assert.match(face, /fill="#b52e3c"/);
  }
  assert.match(renderCardFace({ rank: "K", suit: "♠" }), /fill="#17221e"/);
});

test("ten-card pips use the compact two-column layout and proportional sizes", () => {
  assert.deepEqual(PIP_LAYOUTS["10"], [
    { x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 30 },
    { x: 30, y: 40 }, { x: 70, y: 40 }, { x: 30, y: 60, flip: true },
    { x: 70, y: 60, flip: true }, { x: 50, y: 70, flip: true },
    { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true },
  ]);
  assert.equal((renderCardFace({ rank: "10", suit: "♠" }).match(/width="16"/g) ?? []).length, 10);
  assert.match(renderCardFace({ rank: "A", suit: "♠" }), /width="31"/);
});

test("court rank is hidden during an early squeeze and shown near completion", () => {
  const early = renderCardFace({ rank: "Q", suit: "♦", faceUp: false, squeezeProgress: 40 });
  const late = renderCardFace({ rank: "Q", suit: "♦", faceUp: false, squeezeProgress: 80 });
  assert.doesNotMatch(early, />Q</);
  assert.match(late, />Q</);
});
