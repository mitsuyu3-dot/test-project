import assert from "node:assert/strict";
import test from "node:test";
import { baccaratWinner, evaluateSideBets, handTotal, settleRound } from "../baccarat-rules.mjs";

const cards = (...ranks) => ranks.map(rank => ({ rank }));

test("baccarat point values use the ones digit", () => {
  assert.equal(handTotal(cards("10", "K", "9")), 9);
  assert.equal(handTotal(cards("9", "8", "4")), 1);
  assert.deepEqual(baccaratWinner(cards("4", "2"), cards("3", "3")), { playerTotal: 6, bankerTotal: 6, winner: "tie" });
});

test("TIE 6 is separate from a normal tie", () => {
  assert.equal(evaluateSideBets(cards("4", "2"), cards("5", "A")).tie6.won, true);
  assert.equal(evaluateSideBets(cards("4", "3"), cards("5", "2")).tie6.won, false);
});

test("TIGER PAIR pays by the first four cards only", () => {
  assert.equal(evaluateSideBets(cards("7", "7"), cards("2", "4")).tigerPair.multiplier, 4);
  assert.equal(evaluateSideBets(cards("7", "7"), cards("4", "4")).tigerPair.multiplier, 20);
  assert.equal(evaluateSideBets(cards("7", "7"), cards("7", "7", "K")).tigerPair.multiplier, 100);
  assert.equal(evaluateSideBets(cards("7", "7", "7"), cards("2", "4")).tigerPair.multiplier, 4);
});

test("SMALL 6 requires a two-card banker six and a banker win", () => {
  assert.equal(evaluateSideBets(cards("2", "2"), cards("4", "2")).small6.won, true);
  assert.equal(evaluateSideBets(cards("9", "9"), cards("4", "2")).small6.won, false);
});

test("BIG 6 requires banker third-card six and a banker win", () => {
  assert.equal(evaluateSideBets(cards("2", "2"), cards("K", "K", "6")).big6.won, true);
  assert.equal(evaluateSideBets(cards("9", "9"), cards("K", "K", "6")).big6.won, false);
});

test("LUCKY 6 uses a different multiplier for two and three banker cards", () => {
  assert.equal(evaluateSideBets(cards("2", "2"), cards("4", "2")).lucky6.multiplier, 12);
  assert.equal(evaluateSideBets(cards("2", "2"), cards("K", "K", "6")).lucky6.multiplier, 20);
  assert.equal(evaluateSideBets(cards("9", "9"), cards("4", "2")).lucky6.won, false);
});

test("only selected side bets produce a payout and return the stake", () => {
  const settlement = settleRound({ mainTarget: "player", stake: 100, selectedSideBets: ["tie6"], playerHand: cards("4", "2"), bankerHand: cards("5", "A") });
  assert.equal(settlement.bets.find(bet => bet.key === "tie6").returnAmount, 3600);
  assert.equal(settlement.totalPayout, 3600);
  const noSideBet = settleRound({ mainTarget: "player", stake: 100, selectedSideBets: [], playerHand: cards("4", "2"), bankerHand: cards("3", "2") });
  assert.equal(noSideBet.totalPayout, 200);
});
