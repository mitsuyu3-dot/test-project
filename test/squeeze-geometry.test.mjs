import assert from "node:assert/strict";
import test from "node:test";
import { clipForDirection, detectSqueezeDirection, progressForDirection } from "../squeeze-geometry.mjs";

const box = { width: 100, height: 140 };

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

test("edge and corner masks use different clip paths", () => {
  assert.match(clipForDirection("left", 20), /inset/);
  assert.match(clipForDirection("top", 20), /inset/);
  assert.match(clipForDirection("top-left", 20), /polygon/);
});
