import assert from "node:assert/strict";
import test from "node:test";
import { inferRankCandidates, rankCandidatesFromPips } from "../candidate-geometry.mjs";
import { PIP_LAYOUTS } from "../card-renderer.mjs";
import { canGrabSqueezeBoundary, clipForDirection, detectSqueezeDirection, progressForDirection, progressFromBoundary } from "../squeeze-geometry.mjs";

const box = { width: 100, height: 140 };

test("candidate inference uses only observed pip positions", () => {
  const sevenAndEightClue = [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 32 }];
  assert.deepEqual(rankCandidatesFromPips(sevenAndEightClue), ["7", "8"]);
  assert.deepEqual(inferRankCandidates([{ x: 30, y: 20 }, { x: 70, y: 20 }], "left", 23), ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);
  assert.deepEqual(inferRankCandidates([], "bottom", 40), ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);
  assert.equal(PIP_LAYOUTS["10"].length, 10);
});

test("auto direction detects four edges and four corners", () => {
  assert.equal(detectSqueezeDirection({ ...box, startX: 5, startY: 70, dx: 35, dy: 2 }), "left");
  assert.equal(detectSqueezeDirection({ ...box, startX: 95, startY: 70, dx: -35, dy: 2 }), "right");
  assert.equal(detectSqueezeDirection({ ...box, startX: 50, startY: 5, dx: 2, dy: 35 }), "top");
  assert.equal(detectSqueezeDirection({ ...box, startX: 50, startY: 135, dx: 2, dy: -35 }), "bottom");
  assert.equal(detectSqueezeDirection({ ...box, startX: 5, startY: 5, dx: 35, dy: 35 }), "top-left");
  assert.equal(detectSqueezeDirection({ ...box, startX: 95, startY: 5, dx: -35, dy: 35 }), "top-right");
  assert.equal(detectSqueezeDirection({ ...box, startX: 5, startY: 135, dx: 35, dy: -35 }), "bottom-left");
  assert.equal(detectSqueezeDirection({ ...box, startX: 95, startY: 135, dx: -35, dy: -35 }), "bottom-right");
});

test("direction progress does not add horizontal and vertical percentages", () => {
  assert.equal(progressForDirection("left", { ...box, dx: 20, dy: 100 }), 20);
  assert.equal(progressForDirection("top-left", { ...box, dx: 20, dy: 100 }), 20);
  assert.equal(progressForDirection("bottom-right", { ...box, dx: -50, dy: -70 }), 50);
});

test("boundary progress is calculated from normalized card coordinates", () => {
  assert.equal(progressFromBoundary("left", { x: 0.42, y: 0.5 }), 42);
  assert.equal(progressFromBoundary("right", { x: 0.42, y: 0.5 }), 58);
  assert.equal(progressFromBoundary("top", { x: 0.5, y: 0.25 }), 25);
  assert.equal(progressFromBoundary("bottom", { x: 0.5, y: 0.75 }), 25);
  assert.equal(progressFromBoundary("bottom-right", { x: 0.4, y: 0.6 }), 40);
});

test("a partially revealed boundary can be grabbed again", () => {
  assert.equal(canGrabSqueezeBoundary("left", { x: 0.32, y: 0.5 }, 31), true);
  assert.equal(canGrabSqueezeBoundary("left", { x: 0.38, y: 0.5 }, 23), true);
  assert.equal(canGrabSqueezeBoundary("right", { x: 0.68, y: 0.5 }, 31), true);
  assert.equal(canGrabSqueezeBoundary("bottom", { x: 0.5, y: 0.69 }, 31), true);
  assert.equal(canGrabSqueezeBoundary("left", { x: 0.9, y: 0.5 }, 31), false);
});

test("edge and corner masks use different clip paths", () => {
  assert.match(clipForDirection("left", 20), /inset/);
  assert.equal(clipForDirection("right", 20), "inset(0 0 0 80%)");
  assert.match(clipForDirection("top", 20), /inset/);
  assert.equal(clipForDirection("bottom", 20), "inset(80% 0 0 0)");
  assert.match(clipForDirection("top-left", 20), /polygon/);
  assert.equal(clipForDirection("bottom-right", 100), "inset(0)");
});

test("all eight squeeze directions produce a non-empty reveal mask", () => {
  for (const direction of ["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"]) {
    assert.match(clipForDirection(direction, 35), /inset|polygon/);
  }
});
