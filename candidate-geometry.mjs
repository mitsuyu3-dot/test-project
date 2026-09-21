import { CARD_RANKS, PIP_LAYOUTS } from "./card-renderer.mjs";

const PIP_RANKS = Object.keys(PIP_LAYOUTS);
const PIP_TOLERANCE = 1.5;

function samePip(first, second) {
  return Math.abs(first.x - second.x) <= PIP_TOLERANCE && Math.abs(first.y - second.y) <= PIP_TOLERANCE;
}

export function visiblePipsForRegion(pips, direction, progress) {
  const boundary = Math.max(0, Math.min(100, progress));
  return pips.filter(({ x, y }) => {
    if (direction === "left") return x <= boundary;
    if (direction === "right") return x >= 100 - boundary;
    if (direction === "top") return y <= 1.4 * boundary;
    if (direction === "bottom") return y >= 140 - 1.4 * boundary;
    if (direction === "top-left") return x <= boundary && y <= 1.4 * boundary;
    if (direction === "top-right") return x >= 100 - boundary && y <= 1.4 * boundary;
    if (direction === "bottom-left") return x <= boundary && y >= 140 - 1.4 * boundary;
    if (direction === "bottom-right") return x >= 100 - boundary && y >= 140 - 1.4 * boundary;
    return false;
  });
}

export function rankCandidatesFromPips(visiblePips) {
  if (!visiblePips.length) return [...CARD_RANKS];
  const matches = PIP_RANKS.filter(rank => visiblePips.every(observed => PIP_LAYOUTS[rank].some(pip => samePip({ x: pip.x, y: pip.y }, observed))));
  return matches.length ? matches : [...CARD_RANKS];
}

export function inferRankCandidates(pips, direction, progress) {
  return rankCandidatesFromPips(visiblePipsForRegion(pips, direction, progress));
}
