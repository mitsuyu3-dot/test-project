export const PIP_LAYOUTS = Object.freeze({
  A: [{ x: 50, y: 50 }],
  2: [{ x: 50, y: 20 }, { x: 50, y: 80, flip: true }],
  3: [{ x: 50, y: 18 }, { x: 50, y: 50 }, { x: 50, y: 82, flip: true }],
  4: [{ x: 30, y: 27 }, { x: 70, y: 27 }, { x: 30, y: 73, flip: true }, { x: 70, y: 73, flip: true }],
  5: [{ x: 30, y: 27 }, { x: 70, y: 27 }, { x: 50, y: 50 }, { x: 30, y: 73, flip: true }, { x: 70, y: 73, flip: true }],
  6: [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
  7: [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 32 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
  8: [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 32 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 50, y: 68, flip: true }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
  9: [{ x: 30, y: 18 }, { x: 70, y: 18 }, { x: 30, y: 38 }, { x: 70, y: 38 }, { x: 50, y: 50 }, { x: 30, y: 62, flip: true }, { x: 70, y: 62, flip: true }, { x: 30, y: 82, flip: true }, { x: 70, y: 82, flip: true }],
  10: [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 30 }, { x: 30, y: 40 }, { x: 70, y: 40 }, { x: 30, y: 60, flip: true }, { x: 70, y: 60, flip: true }, { x: 50, y: 70, flip: true }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
});

export const CARD_RANKS = Object.freeze(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);

const SUIT_PATHS = Object.freeze({
  heart: "M0 8 C-18-8-13-22 0-12 C13-22 18-8 0 8Z",
  diamond: "M0-20 L13 0 L0 20 L-13 0Z",
  spade: "M0-20 C-17-4-17 7-7 8 C-3 9-1 5 0 2 C1 5 3 9 7 8 C17 7 17-4 0-20Z M-3 8 L3 8 L6 16 L-6 16Z",
  club: "M0-2 C-17-18-29 4-13 9 C-7 11-3 7 0 3 C3 7 7 11 13 9 C29 4 17-18 0-2Z M-3 7 L3 7 L6 17 L-6 17Z",
});

function suitName(suit) { return { "♥": "heart", "♦": "diamond", "♠": "spade", "♣": "club" }[suit] ?? "heart"; }
function suitColor(suit) { return ["♥", "♦"].includes(suit) ? "#b52e3c" : "#17221e"; }
function useSuit(suit, x, y, size = 19, flip = false) { return `<use href="#suit-${suitName(suit)}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${suitColor(suit)}"${flip ? ` transform="rotate(180 ${x} ${y})"` : ""} />`; }
function indexMarkup(rank, suit, x, y, rotate = false) { return `<g class="card-index"${rotate ? ` transform="rotate(180 ${x} ${y})"` : ""}><text x="${x}" y="${y}" fill="${suitColor(suit)}">${rank}</text>${useSuit(suit, x + 1, y + 8, 10)}</g>`; }
function courtMarkup(rank, suit, showRank = true) { const colors = { J: "#2b6f63", Q: "#8c4761", K: "#89672f" }; return `<g class="court-figure"><rect x="25" y="35" width="50" height="70" rx="8" fill="${colors[rank]}" opacity=".95"/><circle cx="50" cy="48" r="10" fill="#f5dcc1"/><path d="M34 91 Q50 64 66 91" fill="none" stroke="#f5e9d2" stroke-width="7"/><path d="M36 74 L64 74" stroke="#f5e9d2" stroke-width="4"/>${showRank ? `<text x="50" y="101" fill="#f5e9d2">${rank}</text>` : ""}</g>`; }

export function renderCardFace({ rank, suit, faceUp = true, squeezeProgress = 100 }) {
  const progress = Math.max(0, Math.min(100, squeezeProgress));
  const showIndex = faceUp || progress >= 75;
  const isCourt = ["J", "Q", "K"].includes(rank);
  const isNumber = rank === "A" || Object.hasOwn(PIP_LAYOUTS, rank);
  const pips = isNumber && (faceUp || progress > 0) ? (PIP_LAYOUTS[rank] ?? []).map(pip => useSuit(suit, pip.x, pip.y, rank === "A" ? 33 : 19, pip.flip)).join("") : "";
  const defs = Object.entries(SUIT_PATHS).map(([name, path]) => `<symbol id="suit-${name}" viewBox="-30 -30 60 60"><path d="${path}"/></symbol>`).join("");
  return `<svg class="card-face-svg" viewBox="0 0 100 140" aria-hidden="true"><defs>${defs}</defs>${showIndex ? indexMarkup(rank, suit, 12, 19) + indexMarkup(rank, suit, 88, 121, true) : ""}${isCourt ? courtMarkup(rank, suit, faceUp || progress >= 75) : pips}</svg>`;
}
