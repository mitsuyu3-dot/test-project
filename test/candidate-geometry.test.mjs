import assert from "node:assert/strict";
import test from "node:test";
import { inferRankCandidates, rankCandidatesFromPips, visiblePipsForRegion } from "../candidate-geometry.mjs";

test("the same observed pip positions produce the same candidates from every edge", () => {
  const pips = [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 32 }];
  assert.deepEqual(rankCandidatesFromPips(pips), ["7", "8"]);
  const seven = [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 32 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 80 }, { x: 70, y: 80 }];
  assert.deepEqual(inferRankCandidates(seven, "left", 100), ["7"]);
  assert.deepEqual(inferRankCandidates(seven, "right", 100), ["7"]);
  assert.deepEqual(inferRankCandidates(seven, "top", 100), ["7"]);
  assert.deepEqual(inferRankCandidates(seven, "bottom", 100), ["7"]);
});

test("corner exposure only includes pips inside the visible corner", () => {
  const pips = [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 30, y: 80 }];
  assert.deepEqual(visiblePipsForRegion(pips, "top-left", 50), [{ x: 30, y: 20 }]);
  assert.deepEqual(visiblePipsForRegion(pips, "bottom-right", 50), []);
});

test("no observed pips keeps face and number candidates available", () => {
  assert.deepEqual(rankCandidatesFromPips([]), ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);
});

test("partial pips do not falsely confirm ten", () => {
  const leftColumn = [20, 40, 60, 80].map(y => ({ x: 30, y, size: 19 }));
  assert.equal(inferRankCandidates(leftColumn, "left", 31).length, 13);
});
