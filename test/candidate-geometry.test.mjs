import assert from "node:assert/strict";
import test from "node:test";
import { analyzeRankCandidates, inferRankCandidates, rankCandidatesFromPips, visiblePipsForRegion } from "../candidate-geometry.mjs";

const ALL_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

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

test("nine is not confirmed while its center pip is still hidden", () => {
  const outerNine = [18, 38, 62, 82].flatMap(y => [{ x: 30, y, size: 19 }, { x: 70, y, size: 19 }]);
  const analysis = analyzeRankCandidates(outerNine, "left", 50);
  assert.deepEqual(analysis.candidates, ["8", "9", "10"]);
  assert.equal(analysis.canConfirm, false);
});

test("a partially visible nine center pip cannot confirm the rank", () => {
  const nine = [{ x: 50, y: 50, size: 19 }, ...[18, 38, 62, 82].flatMap(y => [{ x: 30, y, size: 19 }, { x: 70, y, size: 19 }])];
  const analysis = analyzeRankCandidates(nine, "left", 58);
  assert.equal(analysis.canConfirm, false);
  assert.ok(analysis.candidates.includes("9"));
});

test("a fully visible center pip can distinguish nine from eight and ten", () => {
  const nine = [{ x: 50, y: 50, size: 19 }, ...[18, 38, 62, 82].flatMap(y => [{ x: 30, y, size: 19 }, { x: 70, y, size: 19 }])];
  const analysis = analyzeRankCandidates(nine, "left", 100);
  assert.deepEqual(analysis.candidates, ["9"]);
  assert.equal(analysis.canConfirm, true);
});

test("candidate inference has no access to a hidden answer rank", () => {
  assert.equal(inferRankCandidates.length, 3);
});

test("all ranks stay possible when no rank-bearing public information is visible", () => {
  for (const direction of ["bottom", "left", "right"]) {
    for (const progress of [0, 10, 20, 30]) assert.deepEqual(inferRankCandidates([], direction, progress), ALL_RANKS);
  }
});
