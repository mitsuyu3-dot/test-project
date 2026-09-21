export const SQUEEZE_MODES = Object.freeze(["auto", "horizontal", "vertical", "corner"]);
export const SQUEEZE_DIRECTIONS = Object.freeze(["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"]);

const clamp = value => Math.max(0, Math.min(100, value));

export function detectSqueezeDirection({ startX, startY, dx, dy, width, height, mode = "auto" }) {
  const nearLeft = startX <= width * 0.25;
  const nearRight = startX >= width * 0.75;
  const nearTop = startY <= height * 0.25;
  const nearBottom = startY >= height * 0.75;
  const diagonal = Math.abs(dx) >= Math.abs(dy) * 0.55 && Math.abs(dy) >= Math.abs(dx) * 0.55;

  if (mode === "corner" || (mode === "auto" && diagonal && (nearLeft || nearRight) && (nearTop || nearBottom))) {
    return `${nearTop ? "top" : "bottom"}-${nearLeft ? "left" : "right"}`;
  }
  if (mode === "horizontal") return startX < width / 2 ? "left" : "right";
  if (mode === "vertical") return startY < height / 2 ? "top" : "bottom";
  if (nearLeft && Math.abs(dx) >= Math.abs(dy) * 0.65) return "left";
  if (nearRight && Math.abs(dx) >= Math.abs(dy) * 0.65) return "right";
  if (nearTop && Math.abs(dy) >= Math.abs(dx) * 0.65) return "top";
  if (nearBottom && Math.abs(dy) >= Math.abs(dx) * 0.65) return "bottom";
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "left" : "right";
  return dy >= 0 ? "top" : "bottom";
}

export function progressForDirection(direction, { dx, dy, width, height }) {
  const x = (dx / width) * 100;
  const y = (dy / height) * 100;
  const progress = { left: x, right: -x, top: y, bottom: -y, "top-left": Math.min(x, y), "top-right": Math.min(-x, y), "bottom-left": Math.min(x, -y), "bottom-right": Math.min(-x, -y) }[direction] ?? 0;
  return clamp(progress);
}

export function progressFromBoundary(direction, { x, y }) {
  const progress = { left: x, right: 1 - x, top: y, bottom: 1 - y, "top-left": Math.min(x, y), "top-right": Math.min(1 - x, y), "bottom-left": Math.min(x, 1 - y), "bottom-right": Math.min(1 - x, 1 - y) }[direction] ?? 0;
  return Math.round(clamp(progress * 100) * 100) / 100;
}

export function canGrabSqueezeBoundary(direction, { x, y }, progress, tolerance = 0.16) {
  const p = clamp(progress) / 100;
  if (direction === "left") return x <= Math.max(tolerance, p + tolerance);
  if (direction === "right") return x >= Math.min(1 - tolerance, 1 - p - tolerance);
  if (direction === "bottom") return y >= Math.min(1, 1 - p - tolerance);
  if (direction === "top") return y <= Math.max(0, p + tolerance);
  return false;
}

export function clipForDirection(direction, progress) {
  const p = clamp(progress);
  const remaining = 100 - p;
  if (p >= 100 && direction.includes("-")) return "inset(0)";
  if (direction === "left") return `inset(0 ${remaining}% 0 0)`;
  if (direction === "right") return `inset(0 0 0 ${remaining}%)`;
  if (direction === "top") return `inset(0 0 ${remaining}% 0)`;
  if (direction === "bottom") return `inset(${remaining}% 0 0 0)`;
  if (direction === "top-left") return `polygon(0 0, ${p}% 0, 0 ${p}%)`;
  if (direction === "top-right") return `polygon(${100 - p}% 0, 100% 0, 100% ${p}%)`;
  if (direction === "bottom-left") return `polygon(0 ${100 - p}%, 0 100%, ${p}% 100%)`;
  return `polygon(${100 - p}% 100%, 100% ${100 - p}%, 100% 100%)`;
}
