import { cardPoint, handTotal, settleRound } from "./baccarat-rules.mjs";
import { renderCardFace } from "./card-renderer.mjs";

const SAVE_KEY = "velvet-table-save-v2";
const STARTING_CHIPS = 1000;
const SUITS = [{ symbol: "♠", color: "black" }, { symbol: "♥", color: "red" }, { symbol: "♦", color: "red" }, { symbol: "♣", color: "black" }];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const PHASE_LABELS = { betting: "BETTING", dealing: "DEALING", revealing: "REVEALING", third: "THIRD CARD", settled: "SETTLED" };

let state = loadState();
let game = freshGame();
let revealToken = 0;

function loadState() { try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); return saved ? { balance: saved.balance ?? STARTING_CHIPS, history: saved.history ?? [] } : { balance: STARTING_CHIPS, history: [] }; } catch { return { balance: STARTING_CHIPS, history: [] }; } }
function saveState() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function freshGame() { return { phase: "betting", round: state.history.length + 1, playerHand: [], bankerHand: [], currentTurn: null, result: null, bets: { target: null, amount: 0, sideBets: [] }, payout: 0, isAnimating: false, settled: false, thirdChecked: false, autoReveal: false }; }
function formatChips(value) { return value.toLocaleString("ja-JP"); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function drawCard(owner, order, isThirdCard = false) { const suit = SUITS[Math.floor(Math.random() * SUITS.length)]; const rank = RANKS[Math.floor(Math.random() * RANKS.length)]; return { id: `${owner}-${order}-${Date.now()}-${Math.random().toString(16).slice(2)}`, rank, suit: suit.symbol, color: suit.color, owner, order, isDealt: false, revealState: "hidden", squeezeProgress: 0, squeezeDirection: "left", orientation: "portrait", isThirdCard }; }
function getHand(owner) { return owner === "PLAYER" ? game.playerHand : game.bankerHand; }
function getHiddenCards(owner) { return getHand(owner).filter(card => card.isDealt && card.revealState !== "revealed"); }
function getVisibleCards(owner) { return getHand(owner).filter(card => card.isDealt && card.revealState === "revealed"); }
function allDealtCardsRevealed() { return [...game.playerHand, ...game.bankerHand].filter(card => card.isDealt).every(card => card.revealState === "revealed"); }
function cardMarkup(card) {
  if (!card.isDealt) return "";
  if (card.revealState === "squeezing") { const clip = card.squeezeDirection === "right" ? `inset(0 0 0 ${100 - card.squeezeProgress}%)` : card.squeezeDirection === "top" ? `inset(0 0 ${100 - card.squeezeProgress}% 0)` : card.squeezeDirection === "bottom" ? `inset(${100 - card.squeezeProgress}% 0 0 0)` : `inset(0 ${100 - card.squeezeProgress}% 0 0)`; const face = renderCardFace(card); return `<button class="card card-back reveal-card is-squeezing ${card.orientation === "landscape" ? "is-landscape" : ""}" data-card-id="${card.id}" type="button" aria-label="絞り中の裏向きカード。ドラッグで公開範囲を変更"><span class="squeeze-face" style="clip-path:${clip}">${face}</span><span class="squeeze-mask">?</span></button>`; }
  if (card.revealState !== "revealed") return `<button class="card card-back reveal-card" data-card-id="${card.id}" type="button" aria-label="裏向きのカード。タップで公開、ドラッグで絞る">?</button>`;
  return `<button class="card card-face ${card.orientation === "landscape" ? "is-landscape" : ""}" data-card-id="${card.id}" type="button" aria-label="公開済みカード">${renderCardFace({ ...card, faceUp: true })}</button>`;
}
function renderHand(owner) { const cards = getHand(owner); const id = owner === "PLAYER" ? "playerCards" : "bankerCards"; document.querySelector(`#${id}`).innerHTML = cards.filter(card => card.isDealt).map(cardMarkup).join(""); const visible = getVisibleCards(owner); const total = handTotal(visible); const fullyOpen = cards.length > 0 && cards.filter(card => card.isDealt).every(card => card.revealState === "revealed"); const score = document.querySelector(owner === "PLAYER" ? "#playerTotal" : "#bankerTotal"); score.textContent = fullyOpen ? total : visible.length ? `${total} · 暫定` : "?"; }
function renderHistory() { const list = document.querySelector("#historyList"); if (!state.history.length) { list.innerHTML = `<p class="empty-state">まだラウンド履歴がありません。</p>`; return; } list.innerHTML = state.history.map(item => `<div class="history-row"><span class="history-round">#${String(item.round).padStart(2, "0")}</span><span class="history-bet">${item.target.toUpperCase()} · ${formatChips(item.bet)}</span><strong class="history-winner">${item.winner.toUpperCase()} ${item.playerTotal} - ${item.bankerTotal}</strong><span class="history-result ${item.won ? "is-win" : "is-lose"}">${item.won ? `+${formatChips(item.payout)}` : "LOSE"}</span></div>`).join(""); }
function render() {
  document.querySelector("#balanceValue").textContent = formatChips(state.balance); document.querySelector("#roundLabel").textContent = `ROUND ${String(game.round).padStart(2, "0")}`; document.querySelector("#phaseLabel").textContent = PHASE_LABELS[game.phase];
  renderHand("PLAYER"); renderHand("BANKER"); renderHistory();
  const betReady = game.bets.target && game.bets.amount > 0 && totalStake() <= state.balance;
  document.querySelector("#dealButton").disabled = game.phase !== "betting" || !betReady;
  document.querySelector("#revealAllButton").disabled = !["revealing", "third"].includes(game.phase) || game.isAnimating;
  document.querySelector("#newRoundButton").disabled = game.phase !== "settled";
  document.querySelectorAll(".reveal-side-button, .squeeze-side-button, .reveal-all-side-button").forEach(button => { const hand = getHand(button.dataset.owner); button.disabled = !["revealing", "third"].includes(game.phase) || game.isAnimating || !getHiddenCards(button.dataset.owner).length; });
  document.querySelectorAll(".target-button, .chip-button, .side-bet-button").forEach(button => { button.disabled = game.phase !== "betting"; });
  document.querySelector("#clearBet").disabled = game.phase !== "betting";
}
function totalStake() { return game.bets.amount * (1 + game.bets.sideBets.length); }
function setMessage(message) { document.querySelector("#tableMessage").textContent = message; }
function setCardsDealt(cards) { cards.forEach(card => { card.isDealt = true; }); }
async function startGame() {
  if (game.phase !== "betting" || totalStake() > state.balance || !game.bets.target) return;
  state.balance -= totalStake(); game.phase = "dealing"; game.isAnimating = true; setMessage("カードを配っています…"); render();
  game.playerHand = [drawCard("PLAYER", 1), drawCard("PLAYER", 2)]; game.bankerHand = [drawCard("BANKER", 1), drawCard("BANKER", 2)];
  const order = [game.playerHand[0], game.bankerHand[0], game.playerHand[1], game.bankerHand[1]];
  for (const card of order) { card.isDealt = true; render(); await wait(360); }
  game.isAnimating = false; game.phase = "revealing"; game.currentTurn = "PLAYER"; setMessage("カードをタップして、PLAYERまたはBANKERを開いてください"); render();
}
function findCard(id) { return [...game.playerHand, ...game.bankerHand].find(card => card.id === id); }
function revealCard(id, internal = false) { const card = findCard(id); if (!card || !card.isDealt || card.revealState === "revealed" || (game.isAnimating && !internal)) return false; card.revealState = "revealed"; card.squeezeProgress = 100; card.orientation = "portrait"; render(); return true; }
async function revealSide(owner) { if (!["revealing", "third"].includes(game.phase) || game.isAnimating) return; const hidden = getHiddenCards(owner); if (!hidden.length) return; game.isAnimating = true; for (const card of hidden) { revealCard(card.id, true); await wait(420); } game.isAnimating = false; await afterReveal(); render(); }
async function revealAll() { if (!["revealing", "third"].includes(game.phase) || game.isAnimating) return; game.autoReveal = true; game.isAnimating = true; let safety = 0; while (safety++ < 12) { const hidden = [...game.playerHand, ...game.bankerHand].filter(card => card.isDealt && card.revealState !== "revealed"); if (!hidden.length) break; const side = hidden[0].owner; const next = hidden.find(card => card.owner === side) || hidden[0]; revealCard(next.id, true); await wait(430); if (allDealtCardsRevealed() && !game.thirdChecked) { game.isAnimating = false; await afterReveal(); game.isAnimating = true; } } game.isAnimating = false; await afterReveal(); game.autoReveal = false; render(); }
async function afterReveal() { if (!allDealtCardsRevealed() || game.thirdChecked) { render(); return; } game.thirdChecked = true; const playerTotal = handTotal(game.playerHand); const bankerTotal = handTotal(game.bankerHand); const natural = playerTotal >= 8 || bankerTotal >= 8; let playerThirdValue = null; if (!natural && playerTotal <= 5) { game.playerHand.push(drawCard("PLAYER", 3, true)); playerThirdValue = cardPoint(game.playerHand[2]); } if (!natural && shouldBankerDraw(bankerTotal, playerThirdValue)) game.bankerHand.push(drawCard("BANKER", 3, true)); const added = [...game.playerHand, ...game.bankerHand].filter(card => !card.isDealt); if (added.length) { game.phase = "third"; added.forEach(card => { card.isDealt = true; }); setMessage(added.map(card => `${card.owner}に3枚目が配られます`).join(" / ")); render(); return; } setMessage(natural ? "ナチュラルのため追加カードはありません。すべて公開されました。" : "追加カードはありません。結果を確定します。"); settleIfReady(); }
function shouldBankerDraw(bankerTotal, playerThirdValue) { if (playerThirdValue === null) return bankerTotal <= 5; if (bankerTotal <= 2) return true; if (bankerTotal === 3) return playerThirdValue !== 8; if (bankerTotal === 4) return playerThirdValue >= 2 && playerThirdValue <= 7; if (bankerTotal === 5) return playerThirdValue >= 4 && playerThirdValue <= 7; if (bankerTotal === 6) return playerThirdValue === 6 || playerThirdValue === 7; return false; }
function settleIfReady() {
  if (game.settled || !game.thirdChecked || !allDealtCardsRevealed()) return;
  const settlement = settleRound({ mainTarget: game.bets.target, stake: game.bets.amount, selectedSideBets: game.bets.sideBets, playerHand: game.playerHand, bankerHand: game.bankerHand });
  const won = settlement.bets.some(bet => bet.won);
  game.result = settlement; game.payout = settlement.totalPayout; game.settled = true; game.phase = "settled";
  state.balance += settlement.totalPayout; state.history.unshift({ round: game.round, target: game.bets.target, bet: game.bets.amount, winner: settlement.winner, playerTotal: settlement.playerTotal, bankerTotal: settlement.bankerTotal, won, payout: settlement.totalPayout }); state.history = state.history.slice(0, 8); saveState();
  document.querySelector("#resultLabel").textContent = settlement.winner.toUpperCase(); document.querySelector(".table-card").classList.toggle("is-win", won); document.querySelector("#resultDetails").hidden = false;
  document.querySelector("#resultDetails").innerHTML = `<strong>最終得点 ${settlement.playerTotal} - ${settlement.bankerTotal}</strong><br>${settlement.bets.map(bet => `${bet.label} · 掛け金 ${formatChips(bet.stake)} · ${bet.won ? `${bet.multiplier} TO 1 · 払戻 ${formatChips(bet.returnAmount)}` : "はずれ · 払戻 0"}`).join("<br>")}<br>合計払戻：<strong>${formatChips(settlement.totalPayout)} チップ</strong><br>純利益：${settlement.netProfit >= 0 ? "+" : ""}${formatChips(settlement.netProfit)} チップ`;
  setMessage(settlement.totalPayout ? `結果確定 · 払戻 +${formatChips(settlement.totalPayout)} チップ` : `結果確定 · ${settlement.winner.toUpperCase()}の勝利`); render();
}
function startSqueeze(card, direction = "left") { if (!card || card.revealState === "revealed" || game.isAnimating || !["revealing", "third"].includes(game.phase)) return; card.squeezeDirection = direction; card.orientation = ["left", "right"].includes(direction) ? "landscape" : "portrait"; card.revealState = "squeezing"; render(); }
function setSqueezeProgress(card, progress) { if (!card || card.revealState === "revealed") return; card.revealState = "squeezing"; card.squeezeProgress = Math.max(0, Math.min(100, progress)); render(); if (card.squeezeProgress >= 100) { card.revealState = "revealed"; card.squeezeProgress = 100; render(); afterReveal(); } }
function resetForNewRound() { if (game.phase !== "settled") return; game = freshGame(); document.querySelector("#betValue").textContent = "0"; document.querySelectorAll(".target-button, .side-bet-button").forEach(button => button.classList.remove("is-selected")); document.querySelector("#resultLabel").textContent = "BET TO DEAL"; document.querySelector("#resultDetails").hidden = true; document.querySelector("#resultDetails").innerHTML = ""; document.querySelector("#tableMessage").textContent = "ベットを選んで、ラウンドを始めましょう"; document.querySelector(".table-card").classList.remove("is-win"); render(); }

document.querySelector("#betTargets").addEventListener("click", event => { const button = event.target.closest(".target-button"); if (!button || game.phase !== "betting") return; game.bets.target = button.dataset.target; document.querySelectorAll(".target-button").forEach(item => item.classList.toggle("is-selected", item === button)); document.querySelector("#dealButton small").textContent = "チップ額を選択してください"; render(); });
document.querySelector("#sideBets").addEventListener("click", event => { const button = event.target.closest(".side-bet-button"); if (!button || game.phase !== "betting") return; const name = button.dataset.sidebet; game.bets.sideBets = game.bets.sideBets.includes(name) ? game.bets.sideBets.filter(item => item !== name) : [...game.bets.sideBets, name]; button.classList.toggle("is-selected", game.bets.sideBets.includes(name)); render(); });
document.querySelector(".chip-row").addEventListener("click", event => { const button = event.target.closest("[data-amount]"); if (button && game.phase === "betting") { game.bets.amount += Number(button.dataset.amount); document.querySelector("#betValue").textContent = formatChips(game.bets.amount); document.querySelector("#dealButton small").textContent = "タップしてカードを配る"; render(); } if (event.target.closest("#clearBet") && game.phase === "betting") { game.bets.amount = 0; game.bets.sideBets = []; document.querySelector("#betValue").textContent = "0"; document.querySelectorAll(".side-bet-button").forEach(item => item.classList.remove("is-selected")); render(); } });
document.querySelector("#dealButton").addEventListener("click", startGame); document.querySelector("#revealAllButton").addEventListener("click", revealAll); document.querySelector("#newRoundButton").addEventListener("click", resetForNewRound);
document.querySelectorAll(".reveal-side-button").forEach(button => button.addEventListener("click", () => revealSide(button.dataset.owner))); document.querySelectorAll(".reveal-all-side-button").forEach(button => button.addEventListener("click", () => revealSide(button.dataset.owner))); document.querySelectorAll(".squeeze-side-button").forEach(button => button.addEventListener("click", () => startSqueeze(getHiddenCards(button.dataset.owner)[0], button.dataset.direction)));
document.querySelector(".hands").addEventListener("click", event => { const cardElement = event.target.closest(".reveal-card"); if (!cardElement) return; revealCard(cardElement.dataset.cardId); afterReveal(); });
let pointerCard = null; let pointerLast = 0;
document.querySelector(".hands").addEventListener("pointerdown", event => { const element = event.target.closest(".reveal-card"); if (!element) return; pointerCard = findCard(element.dataset.cardId); startSqueeze(pointerCard, pointerCard?.squeezeDirection ?? "left"); pointerLast = ["top", "bottom"].includes(pointerCard?.squeezeDirection) ? event.clientY : event.clientX; element.setPointerCapture?.(event.pointerId); });
document.querySelector(".hands").addEventListener("pointermove", event => { if (!pointerCard) return; const current = ["top", "bottom"].includes(pointerCard.squeezeDirection) ? event.clientY : event.clientX; const progress = pointerCard.squeezeProgress + Math.abs(current - pointerLast) / 80 * 100; setSqueezeProgress(pointerCard, progress); pointerLast = current; });
document.querySelector(".hands").addEventListener("pointerup", () => { pointerCard = null; });
document.querySelector("#resetButton").addEventListener("click", () => { if (!confirm("チップと履歴をリセットしますか？")) return; state = { balance: STARTING_CHIPS, history: [] }; game = freshGame(); saveState(); document.querySelector("#betValue").textContent = "0"; document.querySelectorAll(".target-button, .side-bet-button").forEach(button => button.classList.remove("is-selected")); document.querySelector("#resultLabel").textContent = "BET TO DEAL"; document.querySelector("#resultDetails").hidden = true; document.querySelector("#resultDetails").innerHTML = ""; document.querySelector("#tableMessage").textContent = "ベットを選んで、ラウンドを始めましょう"; document.querySelector(".table-card").classList.remove("is-win"); render(); });
render();
