import { CARD_RANKS, PIP_LAYOUTS } from "./card-renderer.mjs";

const PIP_RANKS = Object.keys(PIP_LAYOUTS);
export const CANDIDATE_GEOMETRY = Object.freeze({
  pipTolerance: 2,
  minVisibleFraction: 0.08,
  fullVisibleFraction: 0.95,
  confirmVisibleFraction: 0.98,
  completeProgress: 99.5,
});
const { pipTolerance: PIP_TOLERANCE, minVisibleFraction: MIN_VISIBLE_FRACTION, fullVisibleFraction: FULL_VISIBLE_FRACTION, confirmVisibleFraction: CONFIRM_VISIBLE_FRACTION, completeProgress: COMPLETE_PROGRESS } = CANDIDATE_GEOMETRY;
const RANK_MATCH_TOLERANCE = 1.5;

function samePip(first, second, tolerance = PIP_TOLERANCE) {
  return Math.abs(first.x - second.x) <= tolerance && Math.abs(first.y - second.y) <= tolerance;
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
  const matches = PIP_RANKS.filter(rank => visiblePips.every(observed => PIP_LAYOUTS[rank].some(pip => samePip({ x: pip.x, y: pip.y }, observed, RANK_MATCH_TOLERANCE))));
  return matches;
}

export function inferRankCandidates(pips, direction, progress) {
  return analyzeRankCandidates(pips, direction, progress).candidates;
}

export function analyzeRankCandidates(pips, direction, progress) {
  const observed = observedPipsForRegion(pips, direction, progress);
  const visible = observed.filter(pip => pip.visibility >= MIN_VISIBLE_FRACTION);
  const fullyVisible = visible.filter(pip => pip.visibility >= FULL_VISIBLE_FRACTION);
  const confirmVisible = visible.filter(pip => pip.visibility >= CONFIRM_VISIBLE_FRACTION);
  const completeReveal = Number(progress) >= COMPLETE_PROGRESS;
  if (!fullyVisible.length) return { candidates: [...CARD_RANKS], canConfirm: false, reason: "判別に必要な完全公開ピップがありません", observed, visible, fullyVisible, confirmVisible };
  const matches = PIP_RANKS.filter(rank => {
    const layout = PIP_LAYOUTS[rank];
    const expectedFullyVisible = layout.filter(pip => visibleFraction({ x: pip.x, y: pip.y, size: 19 }, direction, progress) >= FULL_VISIBLE_FRACTION);
    return expectedFullyVisible.every(expected => fullyVisible.some(actual => samePip(expected, actual))) && fullyVisible.every(actual => layout.some(expected => samePip(expected, actual)));
  });
  const hasFullyVisibleCenter = confirmVisible.some(pip => Math.abs(pip.x - 50) <= PIP_TOLERANCE && Math.abs(pip.y - 50) <= PIP_TOLERANCE);
  let candidates = matches;
  if (!completeReveal && !hasFullyVisibleCenter && matches.some(rank => ["8", "9", "10"].includes(rank))) candidates = [...new Set([...matches, "8", "9", "10"])].sort((first, second) => CARD_RANKS.indexOf(first) - CARD_RANKS.indexOf(second));
  const hasBoundaryPip = visible.some(pip => pip.visibility < CONFIRM_VISIBLE_FRACTION);
  const canConfirm = candidates.length === 1 && completeReveal && !hasBoundaryPip && confirmVisible.length >= fullyVisible.length;
  return { candidates, canConfirm, reason: canConfirm ? `${candidates[0]}の配置が公開情報と一致` : candidates.length === 0 ? "公開情報と一致する候補がありません" : hasBoundaryPip ? "境界上の部分ピップが残っています" : !completeReveal && !hasFullyVisibleCenter ? "中央を含む判別情報がまだ公開されていません" : "候補が複数あります", observed, visible, fullyVisible, confirmVisible };
}
