import { CARD_RANKS, PIP_LAYOUTS } from "./card-renderer.mjs";

const PIP_RANKS = Object.keys(PIP_LAYOUTS);
const PIP_TOLERANCE = 1.5;
const MIN_VISIBLE_FRACTION = 0.04;
const FULL_VISIBLE_FRACTION = 0.98;

function samePip(first, second) {
  return Math.abs(first.x - second.x) <= PIP_TOLERANCE && Math.abs(first.y - second.y) <= PIP_TOLERANCE;
}

function clamp(value) { return Math.max(0, Math.min(1, value)); }

function visibleFraction({ x, y, size = 19 }, direction, progress) {
  const boundary = Math.max(0, Math.min(100, progress));
  const half = size / 2;
  if (direction === "left") return clamp((boundary - (x - half)) / size);
  if (direction === "right") return clamp((x + half - (100 - boundary)) / size);
  if (direction === "top") return clamp((1.4 * boundary - (y - half)) / size);
  if (direction === "bottom") return clamp((y + half - (140 - 1.4 * boundary)) / size);
  if (direction === "top-left") return Math.min(visibleFraction({ x, y, size }, "left", boundary), visibleFraction({ x, y, size }, "top", boundary));
  if (direction === "top-right") return Math.min(visibleFraction({ x, y, size }, "right", boundary), visibleFraction({ x, y, size }, "top", boundary));
  if (direction === "bottom-left") return Math.min(visibleFraction({ x, y, size }, "left", boundary), visibleFraction({ x, y, size }, "bottom", boundary));
  if (direction === "bottom-right") return Math.min(visibleFraction({ x, y, size }, "right", boundary), visibleFraction({ x, y, size }, "bottom", boundary));
  return 0;
}

function observedPipsForRegion(pips, direction, progress) {
  return pips.map(pip => ({ ...pip, visibility: visibleFraction(pip, direction, progress) }));
}

export function visiblePipsForRegion(pips, direction, progress) {
  return observedPipsForRegion(pips, direction, progress).filter(pip => pip.visibility >= MIN_VISIBLE_FRACTION).map(({ visibility, ...pip }) => pip);
}

export function rankCandidatesFromPips(visiblePips) {
  if (!visiblePips.length) return [...CARD_RANKS];
  const matches = PIP_RANKS.filter(rank => visiblePips.every(observed => PIP_LAYOUTS[rank].some(pip => samePip({ x: pip.x, y: pip.y }, observed))));
  return matches;
}

export function inferRankCandidates(pips, direction, progress) {
  const observed = observedPipsForRegion(pips, direction, progress);
  const visible = observed.filter(pip => pip.visibility >= MIN_VISIBLE_FRACTION);
  const fullyVisible = visible.filter(pip => pip.visibility >= FULL_VISIBLE_FRACTION);
  if (!fullyVisible.length) return [...CARD_RANKS];
  const matches = PIP_RANKS.filter(rank => {
    const layout = PIP_LAYOUTS[rank];
    const expectedFullyVisible = layout.filter(pip => visibleFraction({ x: pip.x, y: pip.y, size: 19 }, direction, progress) >= FULL_VISIBLE_FRACTION);
    return expectedFullyVisible.every(expected => fullyVisible.some(actual => samePip(expected, actual))) && fullyVisible.every(actual => layout.some(expected => samePip(expected, actual)));
  });
  return matches;
}
