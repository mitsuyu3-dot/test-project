const STORAGE_KEY = "focusflow-tasks";
const createId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const seedTasks = [
  { id: createId(), text: "今日の優先順位を決める", completed: true },
  { id: createId(), text: "集中タイムを25分つくる", completed: false },
  { id: createId(), text: "明日の予定を確認する", completed: false },
];

let tasks = loadTasks();
let currentFilter = "all";

const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const emptyTitle = document.querySelector("#emptyTitle");
const emptyHint = document.querySelector("#emptyHint");

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : seedTasks;
  } catch {
    return seedTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function visibleTasks() {
  if (currentFilter === "active") return tasks.filter((task) => !task.completed);
  if (currentFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const visible = visibleTasks();
  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  taskList.innerHTML = visible.map((task) => `
    <li class="task-item${task.completed ? " completed" : ""}" data-id="${task.id}">
      <div class="task-main">
        <button class="check-button" type="button" aria-label="${task.completed ? "未完了に戻す" : "完了にする"}" aria-pressed="${task.completed}"></button>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </div>
      <button class="delete-button" type="button" aria-label="「${escapeHtml(task.text)}」を削除">✕</button>
    </li>
  `).join("");

  document.querySelector("#taskCount").textContent = `${tasks.length}件のタスク`;
  document.querySelector("#progressPercent").textContent = `${progress}%`;
  document.querySelector("#progressBar").style.width = `${progress}%`;
  document.querySelector("#progressMessage").textContent = progress === 100 ? "すべて完了。すばらしい一日です！" : progress > 0 ? "いいペース。その調子で進めよう。" : "まずはひとつ、完了させよう。";

  const hasVisibleTasks = visible.length > 0;
  emptyState.hidden = hasVisibleTasks;
  if (!hasVisibleTasks) {
    emptyTitle.textContent = currentFilter === "completed" ? "完了済みのタスクはありません" : currentFilter === "active" ? "未完了のタスクはありません" : "タスクはありません";
    emptyHint.textContent = currentFilter === "all" ? "上のフォームから、最初の一歩を追加しましょう。" : "フィルターを変えて、別のタスクを見てみましょう。";
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ id: createId(), text, completed: false });
  saveTasks();
  taskInput.value = "";
  currentFilter = "all";
  updateFilterButtons();
  render();
  taskInput.focus();
});

taskList.addEventListener("click", (event) => {
  const item = event.target.closest(".task-item");
  if (!item) return;
  const task = tasks.find((candidate) => candidate.id === item.dataset.id);
  if (event.target.closest(".check-button")) task.completed = !task.completed;
  if (event.target.closest(".delete-button")) tasks = tasks.filter((candidate) => candidate.id !== item.dataset.id);
  saveTasks();
  render();
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => { currentFilter = button.dataset.filter; updateFilterButtons(); render(); });
});

document.querySelector("#clearCompleted").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

function updateFilterButtons() {
  document.querySelectorAll(".filter-button").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === currentFilter));
}

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
render();
