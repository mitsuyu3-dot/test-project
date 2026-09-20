const SAVE_KEY = "velvet-table-save-v1";
const STARTING_CHIPS = 1000;
const SUITS = [{ symbol: "♠", color: "black" }, { symbol: "♥", color: "red" }, { symbol: "♦", color: "red" }, { symbol: "♣", color: "black" }];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
let state = loadState();

function loadState() { try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); return saved ? { balance: saved.balance ?? STARTING_CHIPS, history: saved.history ?? [], round: saved.round ?? 0 } : { balance: STARTING_CHIPS, history: [], round: 0 }; } catch { return { balance: STARTING_CHIPS, history: [], round: 0 }; } }
function saveState() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function formatChips(value) { return value.toLocaleString("ja-JP"); }
function cardValue(card) { return ["10", "J", "Q", "K"].includes(card.rank) ? 0 : card.rank === "A" ? 1 : Number(card.rank); }
function handTotal(hand) { return hand.reduce((sum, card) => sum + cardValue(card), 0) % 10; }
function drawCard() { const suit = SUITS[Math.floor(Math.random() * SUITS.length)]; const rank = RANKS[Math.floor(Math.random() * RANKS.length)]; return { ...suit, rank }; }
function shouldBankerDraw(bankerTotal, playerThirdValue) { if (playerThirdValue === null) return bankerTotal <= 5; if (bankerTotal <= 2) return true; if (bankerTotal === 3) return playerThirdValue !== 8; if (bankerTotal === 4) return playerThirdValue >= 2 && playerThirdValue <= 7; if (bankerTotal === 5) return playerThirdValue >= 4 && playerThirdValue <= 7; if (bankerTotal === 6) return playerThirdValue === 6 || playerThirdValue === 7; return false; }
function dealRound() {
  const target = document.querySelector(".target-button.is-selected")?.dataset.target;
  const bet = Number(document.querySelector("#betValue").textContent.replace(/,/g, ""));
  if (!target || !bet || bet > state.balance) return;
  state.balance -= bet; state.round += 1;
  const player = [drawCard(), drawCard()]; const banker = [drawCard(), drawCard()];
  const initialPlayerTotal = handTotal(player); const initialBankerTotal = handTotal(banker); const natural = initialPlayerTotal >= 8 || initialBankerTotal >= 8; let playerThirdValue = null;
  if (!natural) { if (initialPlayerTotal <= 5) { const third = drawCard(); player.push(third); playerThirdValue = cardValue(third); } if (shouldBankerDraw(handTotal(banker), playerThirdValue)) banker.push(drawCard()); }
  const playerTotal = handTotal(player); const bankerTotal = handTotal(banker); const winner = playerTotal === bankerTotal ? "tie" : playerTotal > bankerTotal ? "player" : "banker"; const won = winner === target; const payout = won ? (target === "tie" ? bet * 8 : target === "banker" ? Math.floor(bet * 0.95) : bet) : 0;
  state.balance += won ? bet + payout : 0; state.history.unshift({ round: state.round, target, bet, winner, playerTotal, bankerTotal, won, payout }); state.history = state.history.slice(0, 8); saveState();
  renderRound({ player, banker, playerTotal, bankerTotal, winner, won, payout }); resetBet();
}
function cardMarkup(card) { return `<div class="card ${card.color === "red" ? "is-red" : ""}"><span>${card.rank}</span><b>${card.symbol}</b></div>`; }
function renderCards(id, cards) { document.querySelector(`#${id}`).innerHTML = cards.map(cardMarkup).join(""); }
function renderRound(round) { renderCards("playerCards", round.player); renderCards("bankerCards", round.banker); document.querySelector("#playerTotal").textContent = round.playerTotal; document.querySelector("#bankerTotal").textContent = round.bankerTotal; document.querySelector("#roundLabel").textContent = `ROUND ${String(state.round).padStart(2, "0")}`; document.querySelector("#resultLabel").textContent = round.winner.toUpperCase(); document.querySelector("#tableMessage").textContent = round.won ? `的中！ +${formatChips(round.payout)} チップ` : `今回は${round.winner === "tie" ? "TIE" : round.winner.toUpperCase()}の勝利`; document.querySelector(".table-card").classList.toggle("is-win", round.won); render(); }
function renderHistory() { const list = document.querySelector("#historyList"); if (!state.history.length) { list.innerHTML = `<p class="empty-state">まだラウンド履歴がありません。</p>`; return; } list.innerHTML = state.history.map(item => `<div class="history-row"><span class="history-round">#${String(item.round).padStart(2, "0")}</span><span class="history-bet">${item.target.toUpperCase()} · ${formatChips(item.bet)}</span><strong class="history-winner">${item.winner.toUpperCase()} ${item.playerTotal} - ${item.bankerTotal}</strong><span class="history-result ${item.won ? "is-win" : "is-lose"}">${item.won ? `+${formatChips(item.payout)}` : "LOSE"}</span></div>`).join(""); }
function render() { document.querySelector("#balanceValue").textContent = formatChips(state.balance); renderHistory(); const bet = Number(document.querySelector("#betValue").textContent.replace(/,/g, "")); document.querySelector("#dealButton").disabled = !document.querySelector(".target-button.is-selected") || bet === 0 || bet > state.balance; }
function resetBet() { document.querySelectorAll(".target-button").forEach(button => button.classList.remove("is-selected")); document.querySelector("#betValue").textContent = "0"; document.querySelector("#dealButton small").textContent = "BETを選択してください"; render(); }

document.querySelector("#betTargets").addEventListener("click", event => { const button = event.target.closest(".target-button"); if (!button) return; document.querySelectorAll(".target-button").forEach(item => item.classList.toggle("is-selected", item === button)); document.querySelector("#dealButton small").textContent = "チップ額を選択してください"; render(); });
document.querySelector(".chip-row").addEventListener("click", event => { const button = event.target.closest("[data-amount]"); if (button) { const current = Number(document.querySelector("#betValue").textContent.replace(/,/g, "")); const next = Math.min(state.balance, current + Number(button.dataset.amount)); document.querySelector("#betValue").textContent = formatChips(next); document.querySelector("#dealButton small").textContent = "タップしてカードを配る"; render(); } if (event.target.closest("#clearBet")) resetBet(); });
document.querySelector("#dealButton").addEventListener("click", dealRound);
document.querySelector("#resetButton").addEventListener("click", () => { if (!confirm("チップと履歴をリセットしますか？")) return; state = { balance: STARTING_CHIPS, history: [], round: 0 }; saveState(); resetBet(); document.querySelector("#playerCards").innerHTML = `<div class="card card-back">?</div><div class="card card-back">?</div>`; document.querySelector("#bankerCards").innerHTML = `<div class="card card-back">?</div><div class="card card-back">?</div>`; document.querySelector("#playerTotal").textContent = "—"; document.querySelector("#bankerTotal").textContent = "—"; document.querySelector("#resultLabel").textContent = "BET TO DEAL"; document.querySelector("#tableMessage").textContent = "ベットを選んで、ラウンドを始めましょう"; });
render();
