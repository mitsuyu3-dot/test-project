export const PAYOUT_MODE = "profit-multiplier";

export const PAYOUT_CONFIG = Object.freeze({
  main: Object.freeze({ player: 1, tie: 8, banker: 0.95 }),
  side: Object.freeze({
    tie6: Object.freeze({ label: "TIE 6", multiplier: 35 }),
    tigerPair: Object.freeze({ label: "TIGER PAIR", multiplier: 4 }),
    small6: Object.freeze({ label: "SMALL 6", multiplier: 22 }),
    big6: Object.freeze({ label: "BIG 6", multiplier: 50 }),
    lucky6: Object.freeze({ label: "LUCKY 6", multiplier: 12 }),
  }),
});

export function cardPoint(cardOrRank) {
  const rank = typeof cardOrRank === "string" ? cardOrRank : cardOrRank?.rank;
  if (["10", "J", "Q", "K"].includes(rank)) return 0;
  if (rank === "A") return 1;
  return Number(rank) || 0;
}

export function handTotal(hand = []) {
  return hand.reduce((sum, card) => sum + cardPoint(card), 0) % 10;
}

export function baccaratWinner(playerHand, bankerHand) {
  const playerTotal = handTotal(playerHand);
  const bankerTotal = handTotal(bankerHand);
  return { playerTotal, bankerTotal, winner: playerTotal === bankerTotal ? "tie" : playerTotal > bankerTotal ? "player" : "banker" };
}

function pair(hand) { return hand.length >= 2 && hand[0].rank === hand[1].rank; }

export function evaluateSideBets(playerHand, bankerHand) {
  const { playerTotal, bankerTotal, winner } = baccaratWinner(playerHand, bankerHand);
  const firstFour = [...playerHand.slice(0, 2), ...bankerHand.slice(0, 2)];
  const playerPair = pair(playerHand.slice(0, 2));
  const bankerPair = pair(bankerHand.slice(0, 2));
  const sameRankFour = firstFour.length === 4 && firstFour.every(card => card.rank === firstFour[0].rank);
  const tigerPairMultiplier = sameRankFour ? 100 : playerPair && bankerPair ? 20 : playerPair || bankerPair ? 4 : 0;
  return {
    tie6: { won: winner === "tie" && playerTotal === 6 && bankerTotal === 6, multiplier: PAYOUT_CONFIG.side.tie6.multiplier },
    tigerPair: { won: tigerPairMultiplier > 0, multiplier: tigerPairMultiplier },
    small6: { won: winner === "banker" && handTotal(bankerHand.slice(0, 2)) === 6, multiplier: PAYOUT_CONFIG.side.small6.multiplier },
    big6: { won: winner === "banker" && bankerHand.length === 3 && cardPoint(bankerHand[2]) === 6, multiplier: PAYOUT_CONFIG.side.big6.multiplier },
    lucky6: { won: winner === "banker" && bankerTotal === 6, multiplier: bankerHand.length === 3 ? 20 : PAYOUT_CONFIG.side.lucky6.multiplier },
  };
}

export function settleRound({ mainTarget, stake, selectedSideBets = [], playerHand, bankerHand }) {
  const outcome = baccaratWinner(playerHand, bankerHand);
  const mainWon = mainTarget === outcome.winner;
  const mainMultiplier = PAYOUT_CONFIG.main[mainTarget] ?? 0;
  const main = { key: mainTarget, label: mainTarget?.toUpperCase() ?? "", stake, won: mainWon, multiplier: mainMultiplier, profit: mainWon ? stake * mainMultiplier : 0, returnAmount: mainWon ? stake * (1 + mainMultiplier) : 0 };
  const sideDefinitions = evaluateSideBets(playerHand, bankerHand);
  const side = selectedSideBets.map(key => { const definition = sideDefinitions[key]; const config = PAYOUT_CONFIG.side[key]; const multiplier = definition?.multiplier ?? config?.multiplier ?? 0; const won = Boolean(definition?.won && multiplier > 0); return { key, label: config?.label ?? key, stake, won, multiplier, profit: won ? stake * multiplier : 0, returnAmount: won ? stake * (1 + multiplier) : 0 }; });
  const bets = [main, ...side];
  return { ...outcome, bets, totalStake: stake * (1 + selectedSideBets.length), totalPayout: bets.reduce((sum, bet) => sum + bet.returnAmount, 0), netProfit: bets.reduce((sum, bet) => sum + bet.returnAmount, 0) - stake * (1 + selectedSideBets.length) };
}
