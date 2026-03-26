"use strict";

const STORAGE_KEY = "xiaojizhangben-v1";
const CLOUD_BACKUP_KEY = "xiaojizhangben-cloud-v1";
const CLOUD_SHADOW_KEY = "xiaojizhangben-cloud-shadow-v1";

const TOKEN = {
  expense: "#e8927a",
  income: "#5ba88a",
  primary: "#1a2b3d",
  secondary: "#8a95a5",
};

const ACCOUNT_TYPES = [
  { name: "储蓄卡", icon: "🏦" },
  { name: "信用卡", icon: "💳" },
  { name: "微信", icon: "💚" },
  { name: "支付宝", icon: "🔵" },
  { name: "现金", icon: "💵" },
  { name: "其他", icon: "💰" },
];

const EXPENSE_CATEGORIES = [
  { name: "餐饮", icon: "🍜", color: "#e58a8a", bg: "#f7e7e7" },
  { name: "交通", icon: "🚗", color: "#6bb9ba", bg: "#e3f2f1" },
  { name: "购物", icon: "🛍️", color: "#6dafcf", bg: "#e5eef5" },
  { name: "娱乐", icon: "🎮", color: "#8fbf9d", bg: "#e4f1e8" },
  { name: "医疗", icon: "💊", color: "#d8be77", bg: "#f5efd9" },
  { name: "住房", icon: "🏠", color: "#b79acb", bg: "#eee7f3" },
  { name: "教育", icon: "📚", color: "#8fb1cd", bg: "#e6edf4" },
  { name: "水电", icon: "💡", color: "#cfaf73", bg: "#f5eedc" },
  { name: "通讯", icon: "📱", color: "#90bad5", bg: "#e4edf4" },
  { name: "其他", icon: "📦", color: "#a8b2bf", bg: "#ecf0f3" },
];

const INCOME_CATEGORIES = [
  { name: "工资", icon: "💼", color: "#5ba88a", bg: "#dff0e8" },
  { name: "兼职", icon: "💻", color: "#6b94c8", bg: "#e3ebf5" },
  { name: "投资", icon: "📈", color: "#d4b96a", bg: "#f4eedc" },
  { name: "奖金", icon: "🏆", color: "#cfa07d", bg: "#f6eadf" },
  { name: "其他", icon: "💰", color: "#8ea4be", bg: "#e7edf4" },
];

const DEFAULT_CATEGORY_BUDGETS = {
  餐饮: 1000,
  交通: 400,
  购物: 800,
  娱乐: 300,
  医疗: 200,
  住房: 2200,
  教育: 300,
  水电: 400,
  通讯: 200,
  其他: 200,
};

const MONTHLY_PRESET = [
  { month: "2025-10", income: 13600, expense: 7800 },
  { month: "2025-11", income: 12900, expense: 7200 },
  { month: "2025-12", income: 14100, expense: 9600 },
  { month: "2026-01", income: 12500, expense: 6900 },
  { month: "2026-02", income: 13100, expense: 8100 },
];

const AVATAR_OPTIONS = ["😊", "😎", "🙂", "🤩", "😺", "🦊", "🐼", "🌤️"];
const LANGUAGE_OPTIONS = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
];

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(
  2,
  "0"
)}`;

let state = loadState();
let toastTimer = null;
let undoTimer = null;
let reminderTimer = null;
const pullRefresh = {
  active: false,
  startY: 0,
  distance: 0,
  scrollEl: null,
};
let lastRenderedTab = "";
const scrollMemory = {};

function createSeedState() {
  const defaultAccount = {
    id: uid(),
    name: "工商银行",
    type: "储蓄卡",
    balance: 12480.5,
    openingBalance: 12480.5,
    lastFourDigits: "6222",
    createdAt: new Date().toISOString(),
  };

  const transactions = [
    mkTx("income", 8500, "工资", "本月工资", "2026-03-05"),
    mkTx("income", 500, "兼职", "设计外包", "2026-03-12"),
    mkTx("income", 300, "投资", "基金分红", "2026-03-18"),
    mkTx("expense", 2200, "住房", "房租", "2026-03-03"),
    mkTx("expense", 500, "购物", "日用品", "2026-03-19"),
    mkTx("expense", 479, "购物", "衣物", "2026-03-20"),
    mkTx("expense", 200, "医疗", "感冒药", "2026-03-10"),
    mkTx("expense", 128, "餐饮", "午餐", "2026-03-22"),
    mkTx("expense", 45, "餐饮", "咖啡", "2026-03-09"),
    mkTx("expense", 56, "交通", "滴滴打车", "2026-03-22"),
    mkTx("expense", 120, "通讯", "手机话费", "2026-03-15"),
    mkTx("expense", 88, "娱乐", "游戏充值", "2026-03-17"),
  ];

  MONTHLY_PRESET.forEach((item) => {
    transactions.push(mkTx("income", item.income, "工资", "历史收入", `${item.month}-15`));
    transactions.push(mkTx("expense", item.expense, "住房", "历史支出", `${item.month}-08`));
  });
  transactions.forEach((item) => {
    item.accountId = defaultAccount.id;
  });

  return {
    accounts: [defaultAccount],
    transactions,
    notifications: [],
    budgets: {
      [currentMonth]: {
        totalBudget: 5000,
        categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS },
      },
    },
    settings: {
      nickname: "小记账本",
      avatar: "😊",
      reminderEnabled: false,
      reminderTime: "20:00",
      lastReminderDate: "",
      darkMode: "system",
      language: "zh-CN",
    },
    ui: {
      tab: "home",
      lastTab: "home",
      statsTab: "overview",
      selectedMonth: currentMonth,
      recordMonth: currentMonth,
      recordFilter: "all",
      recordKeyword: "",
      recordSelectMode: false,
      recordSelectedIds: [],
      budgetMonth: currentMonth,
      lastKnownMonth: currentMonth,
      addType: "expense",
      addAmount: "",
      addCategory: "餐饮",
      addAccountId: defaultAccount.id,
      addNote: "",
      addDate: todayString,
      editingRecordId: "",
      addEntryFrom: "home",
      undoDeleted: null,
      homeLastRefreshAt: Date.now(),
      showSettingsSheet: false,
      settingsSheetType: "",
      settingsForm: {},
      showNoticeSheet: false,
      showAccountSheet: false,
      editingAccountId: null,
      accountForm: { name: "", type: "储蓄卡", balance: "0", lastFourDigits: "" },
      showBudgetSheet: false,
      budgetForm: { month: "", category: "", amount: "", mode: "total" },
      toast: "",
    },
  };
}

function mkTx(type, amount, category, note, date) {
  return {
    id: uid(),
    type,
    amount: Number(amount),
    category,
    note,
    date,
    createdAt: `${date}T12:00:00`,
    accountId: "",
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw);
    const merged = mergeState(createSeedState(), parsed);
    merged.budgets = normalizeBudgetsMap(merged.budgets);
    merged.notifications = Array.isArray(merged.notifications) ? merged.notifications : [];
    merged.accounts = merged.accounts.map((item) => ({
      ...item,
      balance: Number(item.balance || 0),
    }));
    const fallbackId = merged.accounts[0] ? merged.accounts[0].id : "";
    merged.transactions = merged.transactions.map((item) => ({
      ...item,
      accountId: item.accountId || fallbackId,
      createdAt: item.createdAt || `${item.date || getTodayString()}T12:00:00`,
    }));
    merged.accounts = normalizeAccountsWithOpening(merged.accounts, merged.transactions);
    return merged;
  } catch (error) {
    return createSeedState();
  }
}

function mergeState(seed, loaded) {
  return {
    ...seed,
    ...loaded,
    accounts: Array.isArray(loaded.accounts) ? loaded.accounts : seed.accounts,
    transactions: Array.isArray(loaded.transactions) ? loaded.transactions : seed.transactions,
    notifications: Array.isArray(loaded.notifications) ? loaded.notifications : seed.notifications,
    budgets: loaded.budgets && typeof loaded.budgets === "object" ? loaded.budgets : seed.budgets,
    settings: { ...seed.settings, ...(loaded.settings || {}) },
    ui: { ...seed.ui, ...(loaded.ui || {}) },
  };
}

function buildBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    data: {
      accounts: state.accounts,
      transactions: state.transactions,
      notifications: state.notifications,
      budgets: state.budgets,
      settings: state.settings,
    },
  };
}

function readCloudBackupMeta() {
  const parseMeta = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        cloudSyncedAt: parsed.cloudSyncedAt || "",
        exportedAt: parsed.exportedAt || "",
        hasData: Boolean(parsed.data && typeof parsed.data === "object"),
      };
    } catch (error) {
      return null;
    }
  };
  return {
    manual: parseMeta(localStorage.getItem(CLOUD_BACKUP_KEY)),
    shadow: parseMeta(localStorage.getItem(CLOUD_SHADOW_KEY)),
  };
}

function normalizeCategoryBudgets(input) {
  const raw = input && typeof input === "object" ? input : {};
  const merged = { ...DEFAULT_CATEGORY_BUDGETS };
  EXPENSE_CATEGORIES.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(raw, item.name)) {
      merged[item.name] = Number(raw[item.name] || 0);
    } else if (Object.prototype.hasOwnProperty.call(DEFAULT_CATEGORY_BUDGETS, item.name)) {
      merged[item.name] = Number(DEFAULT_CATEGORY_BUDGETS[item.name] || 0);
    } else {
      merged[item.name] = 0;
    }
  });
  return merged;
}

function normalizeBudgetEntry(entry, fallbackTotal = 5000) {
  const source = entry && typeof entry === "object" ? entry : {};
  return {
    totalBudget: Number(source.totalBudget || fallbackTotal || 0),
    categoryBudgets: normalizeCategoryBudgets(source.categoryBudgets),
  };
}

function normalizeBudgetsMap(map) {
  const source = map && typeof map === "object" ? map : {};
  const next = {};
  Object.keys(source).forEach((key) => {
    next[key] = normalizeBudgetEntry(source[key], 5000);
  });
  return next;
}

function normalizeAccountsWithOpening(accounts, transactions) {
  const txList = Array.isArray(transactions) ? transactions : [];
  const netMap = new Map();
  txList.forEach((item) => {
    const aid = item && item.accountId ? item.accountId : "";
    if (!aid) return;
    const amount = Number(item.amount || 0);
    netMap.set(aid, (netMap.get(aid) || 0) + (item.type === "income" ? amount : -amount));
  });
  return (Array.isArray(accounts) ? accounts : []).map((item) => {
    const balance = Number(item.balance || 0);
    const net = Number(netMap.get(item.id) || 0);
    const hasOpening = Number.isFinite(Number(item.openingBalance));
    return {
      ...item,
      balance,
      openingBalance: hasOpening ? Number(item.openingBalance) : balance - net,
      createdAt: item.createdAt || new Date().toISOString(),
    };
  });
}

function syncCloudShadow() {
  try {
    const payload = buildBackupPayload();
    localStorage.setItem(
      CLOUD_SHADOW_KEY,
      JSON.stringify({
        ...payload,
        cloudSyncedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    // ignore cloud shadow write failures
  }
}

function saveManualCloudBackup() {
  try {
    const payload = buildBackupPayload();
    localStorage.setItem(
      CLOUD_BACKUP_KEY,
      JSON.stringify({
        ...payload,
        cloudSyncedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

function persist() {
  recalculateAccountBalances();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncCloudShadow();
}

function recordNotification(message, level = "info") {
  const text = String(message || "").trim();
  if (!text) return;
  const nowTs = Date.now();
  const first = state.notifications[0];
  if (first && first.message === text) {
    const prevTs = new Date(first.createdAt).getTime();
    if (Number.isFinite(prevTs) && nowTs - prevTs < 4000) {
      return;
    }
  }
  state.notifications.unshift({
    id: uid(),
    message: text,
    level,
    read: Boolean(state.ui.showNoticeSheet),
    createdAt: new Date(nowTs).toISOString(),
  });
  if (state.notifications.length > 80) {
    state.notifications = state.notifications.slice(0, 80);
  }
}

function unreadNoticeCount() {
  return state.notifications.filter((item) => !item.read).length;
}

function markAllNotificationsRead() {
  state.notifications.forEach((item) => {
    item.read = true;
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function amountText(value, digits = 2) {
  return `¥${Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function amountNoZero(value) {
  const fixed = Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `¥${fixed}`;
}

function signedAmount(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${amountText(value, 2)}`;
}

function weekdayZh(dateStr) {
  const date = new Date(dateStr);
  const list = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return list[date.getDay()];
}

function fullDateZh(dateStr) {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${weekdayZh(dateStr)}`;
}

function shortDateZh(dateStr) {
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}月${d}日`;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year}年${month}月`;
}

function monthOf(dateString) {
  return dateString.slice(0, 7);
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatHm(timestamp) {
  if (!timestamp) return "--:--";
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatMdHm(timestamp) {
  if (!timestamp) return "--";
  const d = new Date(timestamp);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${m}-${day} ${hm}`;
}

function todayDateOnly() {
  return getTodayString();
}

function hhmmNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function monthCompare(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCategoryMeta(type, name) {
  const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find((item) => item.name === name) || { name, icon: "📌", color: "#9ca4b3", bg: "#ecf0f3" };
}

function monthTransactions(monthKey) {
  return state.transactions.filter((item) => monthOf(item.date) === monthKey);
}

function monthSummary(monthKey) {
  const rows = monthTransactions(monthKey);
  const incomeRows = rows.filter((item) => item.type === "income");
  const expenseRows = rows.filter((item) => item.type === "expense");
  const income = incomeRows.reduce((sum, item) => sum + item.amount, 0);
  const expense = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  return {
    income,
    expense,
    incomeCount: incomeRows.length,
    expenseCount: expenseRows.length,
    balance: income - expense,
  };
}

function getBudgetAlert(monthKey) {
  const budget = getCurrentBudget(monthKey);
  const summary = monthSummary(monthKey);
  const totalOverAmount = Math.max(0, summary.expense - Number(budget.totalBudget || 0));
  const expenseCats = categorySummary("expense", monthKey);
  const overCats = expenseCats
    .map((item) => {
      const catBudget = Number((budget.categoryBudgets || {})[item.name] || 0);
      const over = Math.max(0, item.amount - catBudget);
      return {
        name: item.name,
        over,
      };
    })
    .filter((item) => item.over > 0)
    .sort((a, b) => b.over - a.over);
  return {
    totalOverAmount,
    overCats,
  };
}

function categorySummary(type, monthKey) {
  const map = new Map();
  monthTransactions(monthKey)
    .filter((item) => item.type === type)
    .forEach((item) => map.set(item.category, (map.get(item.category) || 0) + item.amount));
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([name, amount]) => {
      const meta = getCategoryMeta(type, name);
      return {
        name,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        ...meta,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function getCurrentBudget(monthKey) {
  if (!state.budgets[monthKey]) {
    const prevKey = previousMonthKey(monthKey);
    const prev = state.budgets[prevKey];
    state.budgets[monthKey] = normalizeBudgetEntry(
      prev
        ? {
            totalBudget: Number(prev.totalBudget || 5000),
            categoryBudgets: { ...(prev.categoryBudgets || {}) },
          }
        : { totalBudget: 5000, categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS } },
      5000
    );
  } else {
    state.budgets[monthKey] = normalizeBudgetEntry(state.budgets[monthKey], 5000);
  }
  return state.budgets[monthKey];
}

function totalAssets() {
  return state.accounts.reduce((sum, item) => sum + Number(item.balance || 0), 0);
}

function recentGroups(limit = 8) {
  const rows = monthTransactions(getCurrentMonthKey()).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const groups = [];
  rows.forEach((row) => {
    let group = groups.find((item) => item.date === row.date);
    if (!group) {
      group = { date: row.date, list: [], net: 0 };
      groups.push(group);
    }
    group.list.push(row);
    group.net += row.type === "income" ? row.amount : -row.amount;
  });
  return groups.slice(0, 4).map((g) => ({ ...g, list: g.list.slice(0, limit) }));
}

function lastSixMonths(baseMonth) {
  const date = new Date(`${baseMonth}-01T00:00:00`);
  const list = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(date);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const summary = monthSummary(key);
    list.push({
      month: key,
      label: `${d.getMonth() + 1}月`,
      income: summary.income,
      expense: summary.expense,
    });
  }
  return list;
}

function allMonthOptions() {
  const keys = new Set([getCurrentMonthKey()]);
  state.transactions.forEach((item) => keys.add(monthOf(item.date)));
  lastSixMonths(getCurrentMonthKey()).forEach((item) => keys.add(item.month));
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}

function resolveTheme() {
  if (state.settings.darkMode === "on") return "dark";
  if (state.settings.darkMode === "off") return "light";
  const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  return mql && mql.matches ? "dark" : "light";
}

function normalizeBalanceByType(type, balance) {
  const num = Number(balance || 0);
  if (type === "信用卡" && num > 0) return -num;
  return num;
}

function getAccountById(accountId) {
  if (!accountId) return null;
  return state.accounts.find((item) => item.id === accountId) || null;
}

function accountTransactionNet(accountId) {
  return state.transactions.reduce((sum, item) => {
    if (item.accountId !== accountId) return sum;
    return sum + (item.type === "income" ? item.amount : -item.amount);
  }, 0);
}

function recalculateAccountBalances() {
  state.accounts.forEach((account) => {
    const net = accountTransactionNet(account.id);
    const hasOpening = Number.isFinite(Number(account.openingBalance));
    const opening = hasOpening ? Number(account.openingBalance) : Number(account.balance || 0) - net;
    account.openingBalance = opening;
    account.balance = opening + net;
  });
}

function ensureValidAddAccount() {
  const exists = state.accounts.some((item) => item.id === state.ui.addAccountId);
  if (!exists) {
    state.ui.addAccountId = state.accounts[0] ? state.accounts[0].id : "";
  }
}

function syncUiMonthRollover() {
  const liveMonth = getCurrentMonthKey();
  const prevMonth = state.ui.lastKnownMonth || liveMonth;
  if (liveMonth === prevMonth) return false;
  let changed = false;
  if (state.ui.selectedMonth === prevMonth) {
    state.ui.selectedMonth = liveMonth;
    changed = true;
  }
  if (state.ui.recordMonth === prevMonth) {
    state.ui.recordMonth = liveMonth;
    changed = true;
  }
  if (state.ui.budgetMonth === prevMonth) {
    state.ui.budgetMonth = liveMonth;
    changed = true;
  }
  if (state.ui.lastKnownMonth !== liveMonth) {
    state.ui.lastKnownMonth = liveMonth;
    changed = true;
  }
  return changed;
}

function groupedTransactionsByDate(monthKey) {
  const rows = state.transactions
    .filter((item) => monthOf(item.date) === monthKey)
    .slice()
    .sort((a, b) => {
      if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : -1;
      return a.date < b.date ? 1 : -1;
    });

  const map = new Map();
  rows.forEach((item) => {
    if (!map.has(item.date)) {
      map.set(item.date, []);
    }
    map.get(item.date).push(item);
  });

  return [...map.entries()].map(([date, list]) => ({
    date,
    list,
    net: list.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0),
  }));
}

function getFilteredRecordGroups(monthKey, filter) {
  return groupedTransactionsByDate(monthKey)
    .map((group) => ({
      ...group,
      list: group.list.filter((item) => (filter === "all" ? true : item.type === filter)),
    }))
    .filter((group) => group.list.length > 0)
    .map((group) => ({
      ...group,
      net: group.list.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0),
    }));
}

function getVisibleRecordIds(monthKey, filter) {
  return getFilteredRecordGroups(monthKey, filter).flatMap((group) => group.list.map((item) => item.id));
}

function textMatchRecord(item, keyword) {
  if (!keyword) return true;
  const q = keyword.toLowerCase();
  const account = getAccountById(item.accountId);
  const fields = [
    item.note || "",
    item.category || "",
    account ? account.name : "",
    item.type === "income" ? "收入" : "支出",
    String(item.amount || ""),
    shortDateZh(item.date),
  ];
  return fields.some((f) => String(f).toLowerCase().includes(q));
}

function render() {
  const prevScroll = document.querySelector(".screen-scroll");
  if (prevScroll && lastRenderedTab) {
    scrollMemory[lastRenderedTab] = prevScroll.scrollTop;
  }
  const root = document.getElementById("app");
  if (syncUiMonthRollover()) {
    persist();
  }
  ensureValidAddAccount();
  const theme = resolveTheme();
  root.innerHTML = `
    <div class="phone-shell" data-theme="${theme}">
      ${renderScreen()}
      ${renderBottomNav()}
      ${state.ui.showAccountSheet ? renderAccountSheet() : ""}
      ${state.ui.showSettingsSheet ? renderSettingsSheet() : ""}
      ${state.ui.showBudgetSheet ? renderBudgetSheet() : ""}
      ${state.ui.showNoticeSheet ? renderNoticeSheet() : ""}
      ${state.ui.toast ? `<div class="toast">${state.ui.toast}</div>` : ""}
      ${state.ui.undoDeleted ? renderUndoBar() : ""}
    </div>
  `;
  const nextScroll = document.querySelector(".screen-scroll");
  if (nextScroll) {
    const restore = scrollMemory[state.ui.tab];
    nextScroll.scrollTop = typeof restore === "number" ? restore : 0;
  }
  lastRenderedTab = state.ui.tab;
}

function renderUndoBar() {
  const count = state.ui.undoDeleted && Array.isArray(state.ui.undoDeleted.records) ? state.ui.undoDeleted.records.length : 0;
  return `
    <div class="undo-bar">
      <span>已删除 ${count} 条记录</span>
      <button class="undo-btn" data-action="undo-delete-records">撤销</button>
    </div>
  `;
}

function renderScreen() {
  if (state.ui.tab === "records") return renderRecordsPage();
  if (state.ui.tab === "stats") return renderStatsPage();
  if (state.ui.tab === "add") return renderAddPage();
  if (state.ui.tab === "budget") return renderBudgetPage();
  if (state.ui.tab === "settings") return renderSettingsPage();
  return renderHomePage();
}

function renderHomePage() {
  const liveMonth = getCurrentMonthKey();
  const summary = monthSummary(liveMonth);
  const budget = getCurrentBudget(liveMonth);
  const alert = getBudgetAlert(liveMonth);
  const budgetPct = budget.totalBudget > 0 ? Math.min(100, Math.round((summary.expense / budget.totalBudget) * 100)) : 0;
  const todayHeader = fullDateZh(getTodayString());
  const refreshedAt = formatHm(state.ui.homeLastRefreshAt);
  const groups = recentGroups();
  const accountRows = state.accounts;
  const unreadCount = unreadNoticeCount();

  const accountHtml =
    accountRows.length === 0
      ? `<div class="empty-box">暂无账户，点击右上角添加账户。</div>`
      : accountRows
          .map(
            (item) => `
            <div class="account-card">
              <div class="row-between">
                <div>
                  <div class="account-name">${item.name}</div>
                  <div class="account-meta">${item.type} ${item.lastFourDigits ? `**** **** **** ${item.lastFourDigits}` : ""}</div>
                </div>
                <p class="account-balance">${amountNoZero(item.balance)}</p>
              </div>
              <div class="row-between" style="margin-top: 10px;">
                <div class="account-meta">账户余额</div>
                <div class="account-actions">
                  <button class="mini-circle" data-action="edit-account" data-id="${item.id}" title="编辑">✎</button>
                  <button class="mini-circle" data-action="delete-account" data-id="${item.id}" title="删除">🗑</button>
                </div>
              </div>
            </div>
          `
          )
          .join("");

  const quickList = EXPENSE_CATEGORIES.slice(0, 3).concat([{ name: "更多", icon: "➕", bg: "#ecf0f3" }]);

  return `
    <div class="screen-scroll">
      <div class="pull-indicator" id="pullIndicator">
        <span id="pullIndicatorText">下拉刷新</span>
      </div>
      <section class="home-hero">
        <div class="hero-top">
          <div>
            <div class="hero-title"><span style="font-size:18px;">🗂️</span> 我的账本</div>
          </div>
          <button class="circle-btn notice-btn" aria-label="通知" data-action="open-notice-sheet">
            🔔
            ${unreadCount > 0 ? `<span class="notice-badge">${Math.min(unreadCount, 99)}</span>` : ""}
          </button>
        </div>
        <div class="hero-subtitle">总资产（元）</div>
        <p class="asset-value">${amountNoZero(totalAssets())}</p>
        <div class="hero-date">${todayHeader}</div>
        <div class="income-expense-grid">
          <div class="glow-card">
            <div class="glow-title">
              <span class="icon-chip" style="background:rgba(91,168,138,.2)">↗</span>
              <span>本月收入</span>
            </div>
            <div class="glow-amount">${amountNoZero(summary.income)}</div>
          </div>
          <div class="glow-card">
            <div class="glow-title">
              <span class="icon-chip" style="background:rgba(232,146,122,.2)">↘</span>
              <span>本月支出</span>
            </div>
            <div class="glow-amount">${amountNoZero(summary.expense)}</div>
          </div>
        </div>
      </section>

      <div class="home-body">
        <section class="section-card">
          <div class="row-between">
            <h3 class="section-title">本月预算进度</h3>
            <span class="hint">${budgetPct}%</span>
          </div>
          <div class="budget-track"><div class="budget-fill" style="width:${budgetPct}%"></div></div>
          <div class="row-between" style="margin-top:8px;">
            <span class="hint">已花 ${amountNoZero(summary.expense)}</span>
            <span class="hint">预算 ${amountNoZero(budget.totalBudget)}</span>
          </div>
          ${
            alert.totalOverAmount > 0 || alert.overCats.length > 0
              ? `<div class="budget-alert">⚠️ 预算提醒：${
                  alert.totalOverAmount > 0
                    ? `本月总预算超支 ${amountNoZero(alert.totalOverAmount)}`
                    : `${alert.overCats[0].name} 分类超支 ${amountNoZero(alert.overCats[0].over)}`
                }</div>`
              : ""
          }
        </section>

        <section class="section-card">
          <div class="row-between">
            <div>
              <h3 class="section-title">我的账户</h3>
              <p class="hint">总资产 ${amountNoZero(totalAssets())}</p>
            </div>
            <button class="text-link" data-action="open-account">+ 添加账户</button>
          </div>
          ${accountHtml}
        </section>

        <div class="quick-grid">
          ${quickList
            .map(
              (item) => `
              <button class="quick-item" data-action="quick-category" data-category="${item.name}">
                <span class="quick-icon" style="background:${item.bg || "#ecf0f3"}">${item.icon}</span>
                <span class="quick-label">${item.name}</span>
              </button>
            `
            )
            .join("")}
        </div>

        <div class="record-head row-between">
          <div>
            <h3 class="section-title">最近记录</h3>
            <p class="hint">上次刷新 ${refreshedAt}</p>
          </div>
          <div class="row-inline-actions">
            <button class="text-link" data-action="home-refresh">刷新</button>
            <button class="text-link" data-action="open-records">查看全部 ＞</button>
          </div>
        </div>
        <div class="record-list">
          ${
            groups.length === 0
              ? `<div class="empty-box">本月暂无记录，点击底部「记一笔」开始记录。</div>`
              : groups
                  .map(
                    (group) => `
                    <div class="group-head">
                      <span>${shortDateZh(group.date)}</span>
                      <span>净额: ${signedAmount(group.net)}</span>
                    </div>
                    ${group.list
                      .map((item) => {
                        const meta = getCategoryMeta(item.type, item.category);
                        const sign = item.type === "expense" ? "-" : "+";
                        return `
                        <div class="record-item" data-action="edit-record" data-id="${item.id}" data-from="home">
                          <span class="cat-icon" style="background:${meta.bg};">${meta.icon}</span>
                          <div class="record-main">
                            <p class="record-name">${item.note || item.category}</p>
                            <p class="record-cat">${item.category}</p>
                          </div>
                          <span class="record-amount ${item.type === "expense" ? "amount-expense" : "amount-income"}">
                            ${sign}${amountNoZero(item.amount)}
                          </span>
                          <div class="record-row-actions">
                            <button class="record-copy-btn" data-action="copy-record" data-id="${item.id}" title="复制记录">⧉</button>
                            <button class="record-edit-btn" data-action="edit-record" data-id="${item.id}" data-from="home" title="编辑记录">✎</button>
                          </div>
                        </div>`;
                      })
                      .join("")}
                  `
                  )
                  .join("")
          }
        </div>
      </div>
    </div>
  `;
}

function renderRecordsPage() {
  const month = state.ui.recordMonth || getCurrentMonthKey();
  const filter = state.ui.recordFilter || "all";
  const keyword = (state.ui.recordKeyword || "").trim();
  const selectMode = Boolean(state.ui.recordSelectMode);
  const selectedSet = new Set(state.ui.recordSelectedIds || []);
  const options = allMonthOptions()
    .map((key) => `<option value="${key}" ${key === month ? "selected" : ""}>${monthLabel(key)}</option>`)
    .join("");
  const monthRows = monthTransactions(month);
  const incomeTotal = monthRows.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = monthRows.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const net = incomeTotal - expenseTotal;
  const groups = getFilteredRecordGroups(month, filter);
  const searchedGroups = groups
    .map((group) => ({
      ...group,
      list: group.list.filter((item) => textMatchRecord(item, keyword)),
    }))
    .filter((group) => group.list.length > 0)
    .map((group) => ({
      ...group,
      net: group.list.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0),
    }));
  const visibleIds = searchedGroups.flatMap((group) => group.list.map((item) => item.id));
  const selectedVisibleCount = visibleIds.filter((id) => selectedSet.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const resultCount = visibleIds.length;
  return `
    <div class="screen-scroll">
      <section class="stats-page">
        <div class="page-title-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="circle-btn" style="color:#5a6b80;background:rgba(255,255,255,.72);" data-action="back-home">‹</button>
            <h2 class="page-title" style="font-size:38px;">全部记录</h2>
          </div>
          <select class="month-picker" data-action="change-record-month">${options}</select>
        </div>

        <div class="stats-grid-2" style="margin-top:10px;">
          <div class="stats-card" style="padding:10px 12px;">
            <div class="muted">收入</div>
            <div style="font-size:28px;color:#5ba88a;font-weight:700;">${amountNoZero(incomeTotal)}</div>
          </div>
          <div class="stats-card" style="padding:10px 12px;">
            <div class="muted">支出</div>
            <div style="font-size:28px;color:#e8927a;font-weight:700;">${amountNoZero(expenseTotal)}</div>
          </div>
        </div>
        <div class="stats-card" style="padding:10px 12px;margin-top:10px;">
          <div class="row-between">
            <span class="muted">净额</span>
            <span style="font-size:26px;font-weight:700;color:${net >= 0 ? "#5ba88a" : "#e8927a"};">${amountNoZero(net)}</span>
          </div>
          <div class="record-filter-row">
            <button class="record-filter-btn ${filter === "all" ? "active" : ""}" data-action="set-record-filter" data-filter="all">全部</button>
            <button class="record-filter-btn ${filter === "expense" ? "active" : ""}" data-action="set-record-filter" data-filter="expense">仅支出</button>
            <button class="record-filter-btn ${filter === "income" ? "active" : ""}" data-action="set-record-filter" data-filter="income">仅收入</button>
          </div>
          <div class="record-search-wrap">
            <input class="record-search-input" data-action="record-search-input" value="${escapeHtml(
              state.ui.recordKeyword
            )}" placeholder="搜索备注/分类/账户/金额">
            <span class="record-search-count">结果 ${resultCount} 条</span>
          </div>
          <div class="record-select-toolbar">
            ${
              !selectMode
                ? `<button class="record-select-primary" data-action="toggle-record-select-mode" data-mode="on">选择多条</button>`
                : `
                  <div class="record-select-meta">已选 ${selectedVisibleCount} / ${visibleIds.length} 条</div>
                  <div class="record-select-actions">
                    <button class="record-mini-btn" data-action="select-all-visible-records">${allVisibleSelected ? "取消全选" : "全选"}</button>
                    <button class="record-mini-btn" data-action="batch-clone-selected">批量复制</button>
                    <button class="record-mini-btn danger" data-action="batch-delete-selected">批量删除</button>
                    <button class="record-mini-btn" data-action="toggle-record-select-mode" data-mode="off">完成</button>
                  </div>
                `
            }
          </div>
        </div>

        <div class="record-list" style="margin-top:8px;">
          ${
            searchedGroups.length === 0
              ? `<div class="empty-box">该筛选条件下暂无记录。</div>`
              : searchedGroups
                  .map((group) => {
                    return `
                      <div class="group-head">
                        <span>${shortDateZh(group.date)}</span>
                        <span>净额: ${signedAmount(group.net)}</span>
                      </div>
                      ${group.list
                        .map((item) => {
                          const meta = getCategoryMeta(item.type, item.category);
                          const account = getAccountById(item.accountId);
                          const sign = item.type === "expense" ? "-" : "+";
                          const selected = selectedSet.has(item.id);
                          return `
                            <div class="record-item ${selected ? "is-selected" : ""}" data-action="${
                              selectMode ? "toggle-record-selected" : "edit-record"
                            }" data-id="${item.id}" data-from="records">
                              ${
                                selectMode
                                  ? `<button class="record-check ${selected ? "active" : ""}" data-action="toggle-record-selected" data-id="${item.id}" title="选择">✓</button>`
                                  : ``
                              }
                              <span class="cat-icon" style="background:${meta.bg};">${meta.icon}</span>
                              <div class="record-main">
                                <p class="record-name">${item.note || item.category}</p>
                                <p class="record-cat">${item.category}${account ? ` · ${account.name}` : ""}</p>
                              </div>
                              <span class="record-amount ${item.type === "expense" ? "amount-expense" : "amount-income"}">
                                ${sign}${amountNoZero(item.amount)}
                              </span>
                              ${
                                selectMode
                                  ? ``
                                  : `<div class="record-row-actions">
                                      <button class="record-copy-btn" data-action="copy-record" data-id="${item.id}" title="复制记录">⧉</button>
                                      <button class="record-edit-btn" data-action="edit-record" data-id="${item.id}" data-from="records" title="编辑记录">✎</button>
                                      <button class="record-delete-btn" data-action="delete-record" data-id="${item.id}" title="删除记录">🗑</button>
                                    </div>`
                              }
                            </div>
                          `;
                        })
                        .join("")}
                    `;
                  })
                  .join("")
          }
        </div>
      </section>
    </div>
  `;
}

function renderStatsPage() {
  const month = state.ui.selectedMonth;
  const tabs = [
    { key: "overview", label: "概览" },
    { key: "expense", label: "支出" },
    { key: "income", label: "收入" },
    { key: "trend", label: "趋势" },
  ];
  const options = allMonthOptions()
    .map((key) => `<option value="${key}" ${key === month ? "selected" : ""}>${monthLabel(key)}</option>`)
    .join("");
  return `
    <div class="screen-scroll">
      <section class="stats-page">
        <div class="page-title-row">
          <h2 class="page-title">统计报表</h2>
          <select class="month-picker" data-action="change-month">${options}</select>
        </div>
        <div class="segment-wrap">
          ${tabs
            .map(
              (item) =>
                `<button class="segment-btn ${state.ui.statsTab === item.key ? "active" : ""}" data-action="stats-tab" data-tab="${item.key}">${item.label}</button>`
            )
            .join("")}
        </div>
        ${renderStatsTabContent()}
      </section>
    </div>
  `;
}

function renderStatsTabContent() {
  if (state.ui.statsTab === "expense") return renderExpenseStats();
  if (state.ui.statsTab === "income") return renderIncomeStats();
  if (state.ui.statsTab === "trend") return renderTrendStats();
  return renderOverviewStats();
}

function renderOverviewStats() {
  const summary = monthSummary(state.ui.selectedMonth);
  const ratio =
    summary.income > 0 ? Math.min(100, Math.round((summary.expense / summary.income) * 100)) : summary.expense > 0 ? 100 : 0;
  const data = lastSixMonths(state.ui.selectedMonth);
  const maxValue = Math.max(...data.map((item) => Math.max(item.income, item.expense)), 1);
  return `
    <div class="stats-grid-2">
      <div class="metric-card income">
        <div class="metric-title">↗ 本月收入</div>
        <div class="metric-value">${amountNoZero(summary.income)}</div>
        <div class="metric-count">${summary.incomeCount} 笔</div>
      </div>
      <div class="metric-card expense">
        <div class="metric-title">↘ 本月支出</div>
        <div class="metric-value">${amountNoZero(summary.expense)}</div>
        <div class="metric-count">${summary.expenseCount} 笔</div>
      </div>
    </div>

    <div class="stats-card ratio-box">
      <div class="row-between">
        <strong style="font-size:30px;">结余</strong>
        <strong style="font-size:34px;color:${summary.balance >= 0 ? TOKEN.income : TOKEN.expense};">${amountNoZero(summary.balance)}</strong>
      </div>
      <div class="line-track"><div class="line-fill" style="width:${ratio}%;"></div></div>
      <div class="row-between muted">
        <span>支出占收入比例</span>
        <span>${ratio}%</span>
      </div>
    </div>

    <div class="chart-box">
      <strong style="font-size:30px;">近6个月收支</strong>
      <div class="bar-wrap">
        ${data
          .map((item) => {
            const hIncome = Math.max(2, Math.round((item.income / maxValue) * 120));
            const hExpense = Math.max(2, Math.round((item.expense / maxValue) * 120));
            return `
              <div class="bar-item">
                <div class="bar-pair">
                  <div class="bar-income" style="height:${hIncome}px;"></div>
                  <div class="bar-expense" style="height:${hExpense}px;"></div>
                </div>
                <div style="margin-top:6px;">${item.label}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderExpenseStats() {
  const items = categorySummary("expense", state.ui.selectedMonth);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const list = items.length > 0 ? items : EXPENSE_CATEGORIES.slice(0, 5).map((item) => ({ ...item, amount: 0, percent: 0 }));
  const grad = conicFromList(list, total);
  return `
    <div class="stats-card">
      <div style="font-size:31px;">支出分布</div>
      <div class="muted" style="margin-top:4px;">总支出 ${amountNoZero(total)}</div>
      <div class="donut-wrap">
        <div class="donut-chart" style="background:${grad};"></div>
      </div>
    </div>
    ${renderCategoryList(list, "expense")}
  `;
}

function renderIncomeStats() {
  const items = categorySummary("income", state.ui.selectedMonth);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const list = items.length > 0 ? items : INCOME_CATEGORIES.map((item) => ({ ...item, amount: 0, percent: 0 }));
  const grad = conicFromList(list, total);
  return `
    <div class="stats-card">
      <div style="font-size:31px;">收入分布</div>
      <div class="muted" style="margin-top:4px;">总收入 ${amountNoZero(total)}</div>
      <div class="donut-wrap">
        <div class="donut-chart" style="background:${grad};"></div>
      </div>
    </div>
    ${renderCategoryList(list, "income")}
  `;
}

function conicFromList(items, total) {
  if (!total || total <= 0) return "conic-gradient(rgba(26,43,61,0.08) 0 100%)";
  let start = 0;
  const stops = items
    .filter((item) => item.amount > 0)
    .map((item) => {
      const span = (item.amount / total) * 100;
      const end = start + span;
      const seg = `${item.color} ${start}% ${end}%`;
      start = end;
      return seg;
    });
  if (stops.length === 0) return "conic-gradient(rgba(26,43,61,0.08) 0 100%)";
  return `conic-gradient(${stops.join(",")})`;
}

function renderCategoryList(items, type) {
  const colorAmount = type === "expense" ? TOKEN.expense : TOKEN.income;
  return `
    <div class="category-list">
      ${items
        .slice(0, 8)
        .map(
          (item) => `
        <div class="category-item">
          <span class="cat-icon" style="background:${item.bg};">${item.icon}</span>
          <div class="cat-main">
            <p class="cat-name">${item.name}</p>
            <div class="cat-line"><span style="width:${Math.max(2, Math.round(item.percent))}%; background:${item.color};"></span></div>
            <p class="cat-sub">${Math.round(item.percent)}%</p>
          </div>
          <div class="cat-amount" style="color:${colorAmount};">${amountNoZero(item.amount)}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderTrendStats() {
  const rows = monthTransactions(state.ui.selectedMonth).filter((item) => item.type === "expense");
  const [year, month] = state.ui.selectedMonth.split("-").map(Number);
  const days = new Date(year, month, 0).getDate();
  const daily = Array.from({ length: days }, () => 0);
  rows.forEach((item) => {
    const day = Number(item.date.slice(-2));
    daily[day - 1] += item.amount;
  });
  const monthly = lastSixMonths(state.ui.selectedMonth);
  const expensePoints = toLinePoints(monthly.map((item) => item.expense), 360, 140, 18);
  const incomePoints = toLinePoints(monthly.map((item) => item.income), 360, 140, 18);
  const dailyPoints = toLinePoints(daily, 360, 150, 18);
  const tickDays = [...new Set([1, Math.max(1, Math.round(days * 0.33)), Math.max(1, Math.round(days * 0.66)), days])];
  const dailyLabels = tickDays
    .map((day) => {
      const x = 18 + ((day - 1) * (360 - 36)) / (Math.max(1, daily.length - 1) || 1);
      return `<text x="${x - 8}" y="182" fill="#8a95a5" font-size="14">${day}日</text>`;
    })
    .join("");

  return `
    <div class="line-chart">
      <div style="font-size:30px;">每日支出（本月）</div>
      <svg class="svg-box" viewBox="0 0 360 190" preserveAspectRatio="none">
        ${gridLines(360, 190)}
        <polyline points="${dailyPoints}" fill="none" stroke="#5a6b80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${dailyLabels}
      </svg>
    </div>

    <div class="line-chart" style="margin-top:12px;">
      <div style="font-size:30px;">近6个月趋势</div>
      <svg class="svg-box" viewBox="0 0 360 190" preserveAspectRatio="none">
        ${gridLines(360, 190)}
        <polyline points="${incomePoints}" fill="none" stroke="#5ba88a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        <polyline points="${expensePoints}" fill="none" stroke="#e8927a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${monthly
          .map((item, index) => {
            const x = 18 + (index * (360 - 36)) / (monthly.length - 1 || 1);
            return `<text x="${x - 10}" y="182" fill="#8a95a5" font-size="14">${item.label}</text>`;
          })
          .join("")}
      </svg>
      <div class="legend">
        <span><i class="legend-dot" style="background:#5ba88a;"></i>收入</span>
        <span><i class="legend-dot" style="background:#e8927a;"></i>支出</span>
      </div>
    </div>
  `;
}

function gridLines(width, height) {
  const ys = [40, 78, 116, 154];
  return ys.map((y) => `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(26,43,61,0.08)" stroke-width="1"/>`).join("");
}

function toLinePoints(values, width, chartHeight, pad) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const usableW = width - pad * 2;
  return values
    .map((value, index) => {
      const x = pad + (usableW * index) / (values.length - 1 || 1);
      const y = 20 + chartHeight - ((value - min) / span) * chartHeight;
      return `${x},${y.toFixed(2)}`;
    })
    .join(" ");
}

function renderAddPage() {
  const isExpense = state.ui.addType === "expense";
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const amount = state.ui.addAmount || "0";
  const accountOptions = state.accounts;
  const selectedAccount = getAccountById(state.ui.addAccountId) || accountOptions[0] || null;
  const editing = Boolean(state.ui.editingRecordId);

  return `
    <div class="screen-scroll">
      <section class="add-page">
        <div class="add-header ${isExpense ? "expense" : "income"}">
          <div class="add-top-row">
            <button class="circle-btn" data-action="add-back">‹</button>
            <h2 class="add-title">${editing ? "编辑记录" : "添加记录"}</h2>
          </div>
          <div class="switch-pill">
            <button class="${isExpense ? "active" : ""}" data-action="switch-add-type" data-type="expense">支出</button>
            <button class="${!isExpense ? "active" : ""}" data-action="switch-add-type" data-type="income">收入</button>
          </div>
          <div class="add-amount">¥${amount}</div>
          <label class="add-date">
            📅
            <input type="date" class="plain-input" style="color:#1a2b3d;max-width:140px;" data-action="set-add-date" value="${state.ui.addDate}">
          </label>
        </div>

        <div class="input-wrap">
          <input class="plain-input" data-action="add-note-input" placeholder="备注  添加备注（可选）" value="${escapeHtml(
            state.ui.addNote
          )}">
        </div>

        <div class="stats-card" style="padding:10px;">
          <div class="row-between">
            <div class="muted" style="font-size:14px;">选择账户</div>
            ${
              selectedAccount
                ? `<div class="muted" style="font-size:13px;">当前：${escapeHtml(selectedAccount.name)}</div>`
                : `<button class="text-link" style="font-size:14px;" data-action="open-account">+ 添加账户</button>`
            }
          </div>
          ${
            accountOptions.length > 0
              ? `<div class="account-chip-list">
                  ${accountOptions
                    .map(
                      (item) => `
                        <button class="account-chip ${state.ui.addAccountId === item.id ? "active" : ""}" data-action="select-add-account" data-id="${item.id}">
                          <span>${(ACCOUNT_TYPES.find((t) => t.name === item.type) || { icon: "💼" }).icon}</span>
                          <span>${escapeHtml(item.name)}</span>
                          <span>${amountNoZero(item.balance)}</span>
                        </button>
                      `
                    )
                    .join("")}
                </div>`
              : `<div class="empty-box" style="padding:12px 10px;">暂无可用账户，先去添加一个账户。</div>`
          }
        </div>

        <div class="stats-card" style="padding:10px;">
          <div class="muted" style="font-size:14px;">选择分类</div>
          <div class="category-grid">
            ${categories
              .map(
                (item) => `
                <button class="category-btn ${state.ui.addCategory === item.name ? "active" : ""}" data-action="select-add-category" data-category="${item.name}">
                  <span class="cat-icon" style="margin:0 auto;background:${item.bg};">${item.icon}</span>
                  <span class="quick-label">${item.name}</span>
                </button>
              `
              )
              .join("")}
          </div>
        </div>

        <div class="keypad">
          ${["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"]
            .map((key) => `<button data-action="add-key" data-key="${key}">${key}</button>`)
            .join("")}
        </div>

        <button class="save-btn" data-action="save-record" ${Number(state.ui.addAmount || 0) <= 0 || !selectedAccount ? "disabled" : ""}>${
          editing ? "更新记录" : "保存记录"
        }</button>
      </section>
    </div>
  `;
}

function renderBudgetPage() {
  const liveMonth = getCurrentMonthKey();
  const month = state.ui.budgetMonth || liveMonth;
  const options = allMonthOptions()
    .map((key) => `<option value="${key}" ${key === month ? "selected" : ""}>${monthLabel(key)}</option>`)
    .join("");
  const summary = monthSummary(month);
  const budget = getCurrentBudget(month);
  const spent = summary.expense;
  const remaining = budget.totalBudget - spent;
  const progress = budget.totalBudget > 0 ? Math.min(100, Math.round((spent / budget.totalBudget) * 100)) : 0;

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const compare = monthCompare(month, liveMonth);
  const today = new Date();
  const todayDate = today.getDate();
  const elapsedDays = compare < 0 ? daysInMonth : compare > 0 ? 0 : Math.min(todayDate, daysInMonth);
  const leftDays = compare < 0 ? 0 : compare > 0 ? daysInMonth : Math.max(daysInMonth - todayDate + 1, 0);
  const dailyBudget = leftDays > 0 ? remaining / leftDays : 0;
  const dailySpent = elapsedDays > 0 ? spent / elapsedDays : spent;

  const spending = categorySummary("expense", month);
  const spendMap = Object.fromEntries(spending.map((item) => [item.name, item.amount]));

  return `
    <div class="screen-scroll">
      <section class="budget-page">
        <div class="page-title-row">
          <h2 class="page-title">预算管理</h2>
          <select class="month-picker" data-action="change-budget-month">${options}</select>
        </div>
        <p class="hint" style="margin-top:4px;">点击金额可修改预算</p>

        <div class="budget-card">
          <div class="row-between">
            <strong style="font-size:27px;">🐷 月度总预算</strong>
          </div>
          <div class="row-between budget-top">
            <div>
              <div class="budget-mini">已花费</div>
              <div class="budget-value">${amountNoZero(spent)}</div>
            </div>
            <div style="text-align:right;">
              <div class="budget-mini">预算总额</div>
              <div style="font-size:44px;font-weight:700;">
                ${amountNoZero(budget.totalBudget)}
                  <button class="mini-circle" style="margin-left:4px;width:24px;height:24px;font-size:12px;" data-action="edit-total-budget" data-month="${month}">✎</button>
                </div>
              </div>
            </div>
          <div class="line-track"><div class="line-fill" style="width:${progress}%; background:#fff;"></div></div>
          <div class="row-between" style="margin-top:8px;">
            <span class="budget-mini">剩余 ${amountNoZero(remaining)}</span>
            <span class="budget-mini">${progress}%</span>
          </div>
        </div>

        <div class="budget-metrics">
          <div class="metric-mini">
            <strong>${amountNoZero(dailyBudget)}</strong>
            <span>日均预算</span>
          </div>
          <div class="metric-mini">
            <strong>${amountNoZero(dailySpent)}</strong>
            <span>日均花费</span>
          </div>
          <div class="metric-mini">
            <strong>${leftDays}</strong>
            <span>剩余天数</span>
          </div>
        </div>

        <div class="stats-card" style="margin-top:12px;">
          <div class="row-between">
            <strong style="font-size:30px;">分类预算</strong>
          </div>
          ${EXPENSE_CATEGORIES.map((item) => {
            const catBudget = Number(budget.categoryBudgets[item.name] || 0);
            const catSpent = Number(spendMap[item.name] || 0);
            const over = catSpent > catBudget;
            const pct = catBudget > 0 ? Math.min(100, Math.round((catSpent / catBudget) * 100)) : catSpent > 0 ? 100 : 0;
            return `
              <div class="category-item">
                <span class="cat-icon" style="background:${item.bg};">${item.icon}</span>
                <div class="cat-main">
                  <p class="cat-name">${item.name}</p>
                  <div class="cat-line"><span style="width:${Math.max(2, pct)}%;background:${over ? "#e8927a" : item.color};"></span></div>
                </div>
                <div class="cat-amount" style="color:${over ? "#e8927a" : "#5b6f84"};">
                  ${over ? "△ " : ""}${amountNoZero(catSpent)} / ${amountNoZero(catBudget)}
                  <button class="mini-circle" style="width:22px;height:22px;font-size:11px;background:rgba(255,255,255,.72);color:#5a6b80;" data-action="edit-cat-budget" data-month="${month}" data-category="${item.name}">✎</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderSettingsPage() {
  const totalCount = state.transactions.length;
  const totalIncome = state.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = state.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const cloudMeta = readCloudBackupMeta();
  const manualAt = cloudMeta && cloudMeta.manual ? cloudMeta.manual.cloudSyncedAt || "" : "";
  const shadowAt = cloudMeta && cloudMeta.shadow ? cloudMeta.shadow.cloudSyncedAt || "" : "";
  const cloudManualText = manualAt ? formatMdHm(manualAt) : "\u672a\u624b\u52a8\u5907\u4efd";
  const cloudAutoText = shadowAt ? formatMdHm(shadowAt) : "\u672a\u81ea\u52a8\u540c\u6b65";
  let cloudText = "\u6682\u65e0\u4e91\u5907\u4efd";
  if (manualAt) {
    const autoText = shadowAt ? ` \u00b7 \u81ea\u52a8\u540c\u6b65 ${formatHm(shadowAt)}` : "";
    cloudText = `\u624b\u52a8\u5907\u4efd ${formatMdHm(manualAt)}${autoText}`;
  } else if (shadowAt) {
    cloudText = `\u81ea\u52a8\u540c\u6b65 ${formatMdHm(shadowAt)}`;
  }
  const darkModeMap = { system: "跟随系统", on: "已开启", off: "已关闭" };
  const langMap = Object.fromEntries(LANGUAGE_OPTIONS.map((item) => [item.value, item.label]));
  const reminderDesc = state.settings.reminderEnabled
    ? `每日记账提醒 ${state.settings.reminderTime || "20:00"}`
    : "已关闭";
  return `
    <div class="screen-scroll">
      <section class="settings-page">
        <h2 class="page-title">设置</h2>

        <div class="settings-profile">
          <div class="profile-main">
            <div class="avatar">${state.settings.avatar || "😊"}</div>
            <div>
              <div style="font-size:24px;font-weight:600;">${escapeHtml(state.settings.nickname)}</div>
              <div style="font-size:14px;opacity:.92;">已记录 ${totalCount} 笔账单</div>
            </div>
          </div>
          <div style="font-size:24px;">›</div>
        </div>

        <div class="settings-stats">
          <div class="settings-stat-card">
            <div style="font-size:40px;color:#5a6b80;">${totalCount} 笔</div>
            <div class="hint">总笔数</div>
          </div>
          <div class="settings-stat-card">
            <div style="font-size:40px;color:#5ba88a;">${amountNoZero(totalIncome)}</div>
            <div class="hint">总收入</div>
          </div>
          <div class="settings-stat-card">
            <div style="font-size:40px;color:#e8927a;">${amountNoZero(totalExpense)}</div>
            <div class="hint">总支出</div>
          </div>
        </div>

        <div class="settings-block">
          <p class="hint">个人设置</p>
          <div class="settings-group">
            <button class="setting-item" data-action="setting-action" data-key="profile">
              <span class="setting-icon" style="background:#e8eef5;">👤</span>
              <span><p class="setting-title">账户信息</p><p class="setting-desc">设置头像与昵称</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="reminder">
              <span class="setting-icon" style="background:#f5ede1;">🔔</span>
              <span><p class="setting-title">提醒设置</p><p class="setting-desc">${reminderDesc}</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="darkMode">
              <span class="setting-icon" style="background:#eee9f3;">🌙</span>
              <span><p class="setting-title">深色模式</p><p class="setting-desc">${darkModeMap[state.settings.darkMode]}</p></span>
              <span class="setting-tail">›</span>
            </button>
          </div>
        </div>

        <div class="settings-block">
          <p class="hint">数据管理</p>
          <div class="cloud-status-row">
            <span class="hint">手动备份：${cloudManualText}</span>
            <span class="hint">自动同步：${cloudAutoText}</span>
          </div>
          <div class="settings-group">
            <button class="setting-item" data-action="setting-action" data-key="export">
              <span class="setting-icon" style="background:#e3f1ea;">📤</span>
              <span><p class="setting-title">导出数据</p><p class="setting-desc">导出为 CSV 文件</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="rebuild-balance">
              <span class="setting-icon" style="background:#e7edf5;">🧮</span>
              <span><p class="setting-title">资产校准</p><p class="setting-desc">按历史记录重算账户余额</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="backup">
              <span class="setting-icon" style="background:#e5f1ef;">🛝️</span>
              <span><p class="setting-title">数据备份</p><p class="setting-desc">${cloudText}</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="cloud-sync">
              <span class="setting-icon" style="background:#e7edf5;">☁️</span>
              <span><p class="setting-title">立即云同步</p><p class="setting-desc">仅同步到云，不导出文件</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="restore">
              <span class="setting-icon" style="background:#e8eef5;">📜</span>
              <span><p class="setting-title">恢复备份</p><p class="setting-desc">优先恢复云备份，或选择本地JSON</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="cloud-restore">
              <span class="setting-icon" style="background:#e8eef5;">🗂️</span>
              <span><p class="setting-title">仅云恢复</p><p class="setting-desc">直接从云备份恢复</p></span>
              <span class="setting-tail">›</span>
            </button>
            <button class="setting-item" data-action="setting-action" data-key="clear">
              <span class="setting-icon" style="background:#f6e6e6;">🗑️</span>
              <span><p class="setting-title" style="color:#e8927a;">清除数据</p><p class="setting-desc">删除所有记录</p></span>
              <span class="setting-tail">›</span>
            </button>
          </div>
        </div>

        <div class="settings-block">
          <p class="hint">其他</p>
          <div class="settings-group">
            <button class="setting-item" data-action="setting-action" data-key="language">
              <span class="setting-icon" style="background:#e8eef5;">🌐</span>
              <span><p class="setting-title">语言设置</p><p class="setting-desc">${langMap[state.settings.language] || "简体中文"}</p></span>
              <span class="setting-tail">›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderBottomNav() {
  const tab = state.ui.tab === "records" ? "home" : state.ui.tab;
  return `
    <nav class="bottom-nav">
      <button class="nav-btn ${tab === "home" ? "active" : ""}" data-action="nav" data-tab="home"><span class="i">⌂</span><span>首页</span></button>
      <button class="nav-btn ${tab === "stats" ? "active" : ""}" data-action="nav" data-tab="stats"><span class="i">Ⅲ</span><span>统计</span></button>
      <div class="fab-holder"><button class="fab" data-action="nav" data-tab="add">+</button></div>
      <button class="nav-btn ${tab === "budget" ? "active" : ""}" data-action="nav" data-tab="budget"><span class="i">🐷</span><span>预算</span></button>
      <button class="nav-btn ${tab === "settings" ? "active" : ""}" data-action="nav" data-tab="settings"><span class="i">⚙</span><span>设置</span></button>
    </nav>
  `;
}

function renderAccountSheet() {
  const form = state.ui.accountForm;
  return `
    <div class="sheet-mask">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title-row">
          <h3 class="sheet-title">${state.ui.editingAccountId ? "编辑账户" : "添加账户"}</h3>
          <button class="close-btn" data-action="close-account-sheet">×</button>
        </div>
        <div class="sheet-label">账户名称</div>
        <input class="sheet-input" data-action="account-input" data-field="name" value="${escapeHtml(
          form.name
        )}" placeholder="如：招商银行、微信钱包...">
        <div class="sheet-label">账户类型</div>
        <div class="type-grid">
          ${ACCOUNT_TYPES.map(
            (item) =>
              `<button class="type-btn ${form.type === item.name ? "active" : ""}" data-action="select-account-type" data-type="${item.name}">${item.icon}<br>${item.name}</button>`
          ).join("")}
        </div>
        <div class="sheet-label">账户余额（元）</div>
        <input class="sheet-input" data-action="account-input" data-field="balance" value="${escapeHtml(
          form.balance
        )}" type="number" step="0.01" placeholder="信用卡欠款请填负数，如 -2360">
        <div class="sheet-label">卡号末四位（可选）</div>
        <input class="sheet-input" data-action="account-input" data-field="lastFourDigits" value="${escapeHtml(
          form.lastFourDigits
        )}" maxlength="4" placeholder="如：8888">
        <button class="sheet-save" data-action="save-account">保存</button>
      </div>
    </div>
  `;
}

function renderSettingsSheet() {
  const type = state.ui.settingsSheetType;
  const form = state.ui.settingsForm || {};
  let title = "设置";
  let body = "";

  if (type === "profile") {
    title = "账户信息";
    body = `
      <div class="sheet-label">头像</div>
      <div class="avatar-grid">
        ${AVATAR_OPTIONS.map(
          (emoji) =>
            `<button class="avatar-option ${form.avatar === emoji ? "active" : ""}" data-action="settings-select-avatar" data-avatar="${emoji}">${emoji}</button>`
        ).join("")}
      </div>
      <div class="sheet-label">昵称</div>
      <input class="sheet-input" data-action="settings-input" data-field="nickname" value="${escapeHtml(
        form.nickname || ""
      )}" placeholder="请输入昵称">
    `;
  } else if (type === "reminder") {
    const noti = getNotificationStateInfo();
    title = "提醒设置";
    body = `
      <div class="row-between sheet-row">
        <span>开启每日提醒</span>
        <button class="switch-toggle ${form.reminderEnabled ? "on" : ""}" data-action="settings-toggle-reminder">${
          form.reminderEnabled ? "已开启" : "已关闭"
        }</button>
      </div>
      <div class="sheet-label">提醒时间</div>
      <input class="sheet-input" type="time" data-action="settings-input" data-field="reminderTime" value="${escapeHtml(
        form.reminderTime || "20:00"
      )}">
      <div class="sheet-label">通知权限</div>
      <div class="settings-perm-row">
        <span class="hint">${noti.label}</span>
        ${
          noti.canRequest
            ? `<button class="record-mini-btn" data-action="request-notification-permission">去授权</button>`
            : ""
        }
      </div>
      <div class="settings-perm-row">
        <span class="hint">可立即测试一次提醒效果</span>
        <button class="record-mini-btn" data-action="settings-test-reminder">立即测试</button>
      </div>
    `;
  } else if (type === "darkMode") {
    title = "深色模式";
    const modes = [
      { value: "system", label: "跟随系统" },
      { value: "on", label: "开启" },
      { value: "off", label: "关闭" },
    ];
    body = `
      <div class="mode-grid">
        ${modes
          .map(
            (item) =>
              `<button class="mode-option ${form.darkMode === item.value ? "active" : ""}" data-action="settings-select-dark" data-mode="${item.value}">${item.label}</button>`
          )
          .join("")}
      </div>
    `;
  } else if (type === "language") {
    title = "语言设置";
    body = `
      <div class="mode-grid">
        ${LANGUAGE_OPTIONS.map(
          (item) =>
            `<button class="mode-option ${form.language === item.value ? "active" : ""}" data-action="settings-select-language" data-language="${item.value}">${item.label}</button>`
        ).join("")}
      </div>
      <p class="hint" style="margin-top:10px;">当前界面文案仍以中文展示，语言字段已保存。</p>
    `;
  }

  return `
    <div class="sheet-mask">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title-row">
          <h3 class="sheet-title">${title}</h3>
          <button class="close-btn" data-action="close-settings-sheet">×</button>
        </div>
        ${body}
        <div class="sheet-actions">
          <button class="sheet-cancel" data-action="close-settings-sheet">取消</button>
          <button class="sheet-save" data-action="save-settings-sheet">保存</button>
        </div>
      </div>
    </div>
  `;
}

function renderNoticeSheet() {
  const list = state.notifications.slice(0, 60);
  return `
    <div class="sheet-mask">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title-row">
          <h3 class="sheet-title">消息中心</h3>
          <button class="close-btn" data-action="close-notice-sheet">×</button>
        </div>
        <div class="sheet-actions" style="margin-top:10px;">
          <button class="sheet-cancel" data-action="open-reminder-settings">提醒设置</button>
          <button class="sheet-save" data-action="clear-notifications">清空消息</button>
        </div>
        <div class="notice-list">
          ${
            list.length === 0
              ? `<div class="empty-box" style="padding:18px 10px;">暂无消息</div>`
              : list
                  .map(
                    (item) => `
              <div class="notice-item ${item.read ? "" : "unread"}">
                <div class="notice-dot"></div>
                <div class="notice-main">
                  <p class="notice-text">${escapeHtml(item.message)}</p>
                  <p class="notice-time">${formatMdHm(item.createdAt)}</p>
                </div>
              </div>
            `
                  )
                  .join("")
          }
        </div>
      </div>
    </div>
  `;
}

function renderBudgetSheet() {
  const form = state.ui.budgetForm || {};
  const mode = form.mode === "category" ? "category" : "total";
  const month = form.month || state.ui.budgetMonth || getCurrentMonthKey();
  const title = mode === "category" ? `编辑分类预算 · ${form.category || ""}` : "编辑月度总预算";
  const hint =
    mode === "category"
      ? `${monthLabel(month)} · ${form.category || "分类"}`
      : `${monthLabel(month)} · 设置本月预算总额`;
  return `
    <div class="sheet-mask">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title-row">
          <h3 class="sheet-title">${title}</h3>
          <button class="close-btn" data-action="close-budget-sheet">×</button>
        </div>
        <div class="sheet-label">预算金额（元）</div>
        <input class="sheet-input" data-action="budget-input" data-field="amount" type="number" step="0.01" value="${escapeHtml(
          String(form.amount || "")
        )}" placeholder="请输入预算金额">
        <p class="hint" style="margin-top:8px;">${hint}</p>
        <div class="sheet-actions">
          <button class="sheet-cancel" data-action="close-budget-sheet">取消</button>
          <button class="sheet-save" data-action="save-budget-sheet">保存</button>
        </div>
      </div>
    </div>
  `;
}

function showToast(message, options = {}) {
  if (options.log !== false) {
    recordNotification(message, options.level || "info");
  }
  state.ui.toast = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.ui.toast = "";
    render();
  }, 1800);
}

function remindNow(message) {
  const title = "小记账本提醒";
  const fallbackToast = () => {
    showToast(message);
    render();
  };
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body: message });
      } catch (e) {
        fallbackToast();
      }
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          try {
            new Notification(title, { body: message });
          } catch (e) {
            fallbackToast();
          }
        } else {
          fallbackToast();
        }
      });
      return;
    }
  }
  fallbackToast();
}

function getNotificationStateInfo() {
  if (!("Notification" in window)) {
    return {
      label: "当前环境不支持系统通知",
      canRequest: false,
    };
  }
  if (Notification.permission === "granted") {
    return {
      label: "系统通知已授权",
      canRequest: false,
    };
  }
  if (Notification.permission === "denied") {
    return {
      label: "系统通知已拒绝（可在浏览器设置开启）",
      canRequest: false,
    };
  }
  return {
    label: "系统通知未授权",
    canRequest: true,
  };
}

function checkReminderTick() {
  if (!state.settings.reminderEnabled) return;
  const target = state.settings.reminderTime || "20:00";
  const current = hhmmNow();
  const today = todayDateOnly();
  if (current === target && state.settings.lastReminderDate !== today) {
    state.settings.lastReminderDate = today;
    persist();
    remindNow(`现在是 ${target}，记得记一笔账哦`);
  }
}

function setupReminderScheduler() {
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = setInterval(checkReminderTick, 30 * 1000);
  checkReminderTick();
}

function updatePullIndicator(distance) {
  const indicator = document.getElementById("pullIndicator");
  const label = document.getElementById("pullIndicatorText");
  if (!indicator || !label) return;
  const d = Math.max(0, Math.min(120, distance));
  indicator.style.height = `${d}px`;
  indicator.style.opacity = d > 2 ? "1" : "0";
  label.textContent = d >= 72 ? "松开刷新" : "下拉刷新";
}

function resetPullIndicator() {
  pullRefresh.active = false;
  pullRefresh.startY = 0;
  pullRefresh.distance = 0;
  pullRefresh.scrollEl = null;
  updatePullIndicator(0);
}

function triggerHomeRefresh() {
  state.ui.homeLastRefreshAt = Date.now();
  persist();
  showToast("首页数据已刷新");
  render();
}

function shouldStartPullRefresh(event) {
  if (state.ui.tab !== "home") return null;
  if (state.ui.showAccountSheet || state.ui.showSettingsSheet || state.ui.showBudgetSheet || state.ui.showNoticeSheet)
    return null;
  const target = event.target;
  if (!target || !target.closest) return null;
  const scrollEl = target.closest(".screen-scroll");
  if (!scrollEl) return null;
  if (scrollEl.scrollTop > 0) return null;
  return scrollEl;
}

function setUndoDeleted(records) {
  if (!Array.isArray(records) || records.length === 0) {
    state.ui.undoDeleted = null;
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = null;
    return;
  }
  state.ui.undoDeleted = {
    records: records.map((item) => ({ ...item })),
    createdAt: Date.now(),
  };
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    state.ui.undoDeleted = null;
    render();
  }, 9000);
}

function restoreDeletedRecords(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) return 0;
  const accountSet = new Set(state.accounts.map((item) => item.id));
  const existingTxIds = new Set(state.transactions.map((item) => item.id));
  const fallback = state.accounts[0] || null;
  let restored = 0;
  payload.records.forEach((raw) => {
    const tx = { ...raw };
    if (existingTxIds.has(tx.id)) {
      tx.id = uid();
    }
    if (!tx.accountId || !accountSet.has(tx.accountId)) {
      tx.accountId = fallback ? fallback.id : "";
    }
    state.transactions.push(tx);
    existingTxIds.add(tx.id);
    const account = getAccountById(tx.accountId);
    if (account) {
      account.balance += tx.type === "income" ? tx.amount : -tx.amount;
    }
    restored += 1;
  });
  state.transactions.sort((a, b) => {
    if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : -1;
    return a.date < b.date ? 1 : -1;
  });
  return restored;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openAccountSheet(accountId) {
  state.ui.showAccountSheet = true;
  state.ui.editingAccountId = accountId || null;
  if (accountId) {
    const account = state.accounts.find((item) => item.id === accountId);
    if (account) {
      state.ui.accountForm = {
        name: account.name,
        type: account.type,
        balance: String(account.balance),
        lastFourDigits: account.lastFourDigits || "",
      };
    }
  } else {
    state.ui.accountForm = { name: "", type: "储蓄卡", balance: "0", lastFourDigits: "" };
  }
}

function closeAccountSheet() {
  state.ui.showAccountSheet = false;
  state.ui.editingAccountId = null;
}

function openBudgetSheet(mode, month, category) {
  const targetMonth = month || state.ui.budgetMonth || getCurrentMonthKey();
  const budget = getCurrentBudget(targetMonth);
  if (mode === "category") {
    const name = category || "";
    state.ui.budgetForm = {
      month: targetMonth,
      category: name,
      amount: String(Number((budget.categoryBudgets || {})[name] || 0)),
      mode: "category",
    };
  } else {
    state.ui.budgetForm = {
      month: targetMonth,
      category: "",
      amount: String(Number(budget.totalBudget || 0)),
      mode: "total",
    };
  }
  state.ui.showBudgetSheet = true;
}

function closeBudgetSheet() {
  state.ui.showBudgetSheet = false;
  state.ui.budgetForm = { month: "", category: "", amount: "", mode: "total" };
}

function openNoticeSheet() {
  const unread = unreadNoticeCount();
  state.ui.showNoticeSheet = true;
  markAllNotificationsRead();
  if (unread > 0) {
    persist();
  }
}

function closeNoticeSheet() {
  state.ui.showNoticeSheet = false;
}

function saveBudgetSheet() {
  const form = state.ui.budgetForm || {};
  const month = form.month || state.ui.budgetMonth || getCurrentMonthKey();
  const budget = getCurrentBudget(month);
  const amount = Number(form.amount);
  if (Number.isNaN(amount) || amount < 0) {
    showToast("请输入有效预算金额");
    return false;
  }
  if (form.mode === "category") {
    const cat = form.category || "";
    if (!cat) {
      showToast("分类不能为空");
      return false;
    }
    budget.categoryBudgets[cat] = amount;
    showToast(`${cat}预算已更新`);
  } else {
    budget.totalBudget = amount;
    showToast("总预算已更新");
  }
  persist();
  closeBudgetSheet();
  return true;
}

function openSettingsSheet(type) {
  state.ui.showSettingsSheet = true;
  state.ui.settingsSheetType = type;
  if (type === "profile") {
    state.ui.settingsForm = {
      nickname: state.settings.nickname || "",
      avatar: state.settings.avatar || "😊",
    };
  } else if (type === "reminder") {
    state.ui.settingsForm = {
      reminderEnabled: Boolean(state.settings.reminderEnabled),
      reminderTime: state.settings.reminderTime || "20:00",
    };
  } else if (type === "darkMode") {
    state.ui.settingsForm = {
      darkMode: state.settings.darkMode || "system",
    };
  } else if (type === "language") {
    state.ui.settingsForm = {
      language: state.settings.language || "zh-CN",
    };
  } else {
    state.ui.settingsForm = {};
  }
}

function closeSettingsSheet() {
  state.ui.showSettingsSheet = false;
  state.ui.settingsSheetType = "";
  state.ui.settingsForm = {};
}

function saveSettingsSheet() {
  const type = state.ui.settingsSheetType;
  const form = state.ui.settingsForm || {};
  if (type === "profile") {
    const nick = String(form.nickname || "").trim();
    if (!nick) {
      showToast("昵称不能为空");
      return false;
    }
    state.settings.nickname = nick;
    state.settings.avatar = form.avatar || state.settings.avatar || "😊";
    showToast("账户信息已更新");
  } else if (type === "reminder") {
    const time = String(form.reminderTime || "").trim();
    if (!/^\d{2}:\d{2}$/.test(time)) {
      showToast("提醒时间格式不正确");
      return false;
    }
    state.settings.reminderEnabled = Boolean(form.reminderEnabled);
    state.settings.reminderTime = time;
    if (!state.settings.reminderEnabled) {
      state.settings.lastReminderDate = "";
    }
    setupReminderScheduler();
    showToast("提醒设置已更新");
  } else if (type === "darkMode") {
    state.settings.darkMode = form.darkMode || "system";
    showToast("深色模式已更新");
  } else if (type === "language") {
    state.settings.language = form.language || "zh-CN";
    showToast("语言设置已更新");
  } else {
    return false;
  }
  persist();
  closeSettingsSheet();
  return true;
}

function applyKeyInput(key) {
  let val = state.ui.addAmount || "";
  if (key === "⌫") {
    state.ui.addAmount = val.slice(0, -1);
    return;
  }
  if (key === ".") {
    if (!val.includes(".")) state.ui.addAmount = val ? `${val}.` : "0.";
    return;
  }
  if (!/^\d$/.test(key)) return;
  if (val === "0") val = "";
  const next = `${val}${key}`;
  const [intPart, decimalPart] = next.split(".");
  if (intPart.length > 7) return;
  if (decimalPart && decimalPart.length > 2) return;
  state.ui.addAmount = next;
}

function saveRecord() {
  const amount = Number(state.ui.addAmount);
  if (!amount || amount <= 0) {
    showToast("请输入有效金额");
    return;
  }
  const account = getAccountById(state.ui.addAccountId) || state.accounts[0] || null;
  if (!account) {
    showToast("请先添加账户");
    return;
  }
  const isEditing = Boolean(state.ui.editingRecordId);
  const savedType = state.ui.addType;
  const savedDate = state.ui.addDate;
  const note = state.ui.addNote.trim();

  if (isEditing) {
    const old = state.transactions.find((item) => item.id === state.ui.editingRecordId);
    if (!old) {
      showToast("原记录不存在");
      return;
    }
    const oldAccount = getAccountById(old.accountId);
    if (oldAccount) {
      oldAccount.balance += old.type === "income" ? -old.amount : old.amount;
    }
    old.type = state.ui.addType;
    old.amount = amount;
    old.category = state.ui.addCategory;
    old.note = note;
    old.date = state.ui.addDate;
    old.accountId = account.id;
    if (!old.createdAt) old.createdAt = new Date().toISOString();
    account.balance += old.type === "income" ? old.amount : -old.amount;
  } else {
    const tx = {
      id: uid(),
      type: state.ui.addType,
      amount,
      category: state.ui.addCategory,
      note,
      date: state.ui.addDate,
      createdAt: new Date().toISOString(),
      accountId: account.id,
    };
    state.transactions.push(tx);
    account.balance += tx.type === "income" ? amount : -amount;
  }

  state.ui.addAmount = "";
  state.ui.addNote = "";
  state.ui.addDate = getTodayString();
  state.ui.addCategory = EXPENSE_CATEGORIES[0].name;
  state.ui.addType = "expense";
  state.ui.tab = state.ui.addEntryFrom || "home";
  state.ui.editingRecordId = "";
  persist();
  const liveMonth = getCurrentMonthKey();
  if (savedType === "expense" && savedDate.slice(0, 7) === liveMonth) {
    const afterAlert = getBudgetAlert(liveMonth);
    if (afterAlert.totalOverAmount > 0) {
      showToast(`本月预算已超支 ${amountNoZero(afterAlert.totalOverAmount)}`);
      return;
    }
    if (afterAlert.overCats.length > 0) {
      const top = afterAlert.overCats[0];
      showToast(`${top.name} 分类超支 ${amountNoZero(top.over)}`);
      return;
    }
  }
  showToast(isEditing ? "记录已更新" : "记录已保存");
}

function deleteRecord(recordId) {
  const index = state.transactions.findIndex((item) => item.id === recordId);
  if (index < 0) return null;
  const tx = state.transactions[index];
  const removed = { ...tx };
  const account = getAccountById(tx.accountId);
  if (account) {
    account.balance += tx.type === "income" ? -tx.amount : tx.amount;
  }
  state.transactions.splice(index, 1);
  return removed;
}

function setRecordSelectionMode(enabled) {
  state.ui.recordSelectMode = Boolean(enabled);
  if (!state.ui.recordSelectMode) {
    state.ui.recordSelectedIds = [];
  }
}

function toggleRecordSelected(recordId) {
  const set = new Set(state.ui.recordSelectedIds || []);
  if (set.has(recordId)) {
    set.delete(recordId);
  } else {
    set.add(recordId);
  }
  state.ui.recordSelectedIds = [...set];
}

function setRecordSelection(ids) {
  state.ui.recordSelectedIds = [...new Set(ids)];
}

function bulkDeleteRecords(ids) {
  let successCount = 0;
  const removedRecords = [];
  ids.forEach((id) => {
    const removed = deleteRecord(id);
    if (removed) {
      successCount += 1;
      removedRecords.push(removed);
    }
  });
  return { count: successCount, records: removedRecords };
}

function cloneTransactionToToday(tx) {
  const account = getAccountById(tx.accountId) || state.accounts[0] || null;
  if (!account) return false;
  const clone = {
    id: uid(),
    type: tx.type,
    amount: Number(tx.amount),
    category: tx.category,
    note: tx.note || "",
    date: getTodayString(),
    createdAt: new Date().toISOString(),
    accountId: account.id,
  };
  state.transactions.push(clone);
  account.balance += clone.type === "income" ? clone.amount : -clone.amount;
  return true;
}

function bulkCloneRecordsToToday(ids) {
  const txMap = new Map(state.transactions.map((tx) => [tx.id, tx]));
  let count = 0;
  ids.forEach((id) => {
    const tx = txMap.get(id);
    if (tx && cloneTransactionToToday(tx)) count += 1;
  });
  return count;
}

function openAddForCreate(fromTab) {
  const firstExpense = EXPENSE_CATEGORIES[0].name;
  state.ui.editingRecordId = "";
  state.ui.addType = "expense";
  state.ui.addAmount = "";
  state.ui.addCategory = firstExpense;
  state.ui.addNote = "";
  state.ui.addDate = getTodayString();
  state.ui.addEntryFrom = fromTab || state.ui.tab || "home";
  ensureValidAddAccount();
  state.ui.tab = "add";
}

function openAddForEdit(recordId, fromTab) {
  const tx = state.transactions.find((item) => item.id === recordId);
  if (!tx) {
    showToast("记录不存在");
    return;
  }
  state.ui.editingRecordId = tx.id;
  state.ui.addType = tx.type;
  state.ui.addAmount = String(tx.amount);
  state.ui.addCategory = tx.category;
  state.ui.addAccountId = tx.accountId || (state.accounts[0] ? state.accounts[0].id : "");
  state.ui.addNote = tx.note || "";
  state.ui.addDate = tx.date;
  state.ui.addEntryFrom = fromTab || state.ui.tab || "home";
  state.ui.tab = "add";
}

function exportCsv() {
  const liveMonth = getCurrentMonthKey();
  const header = ["id", "type", "amount", "category", "note", "date", "createdAt", "accountId"];
  const rows = state.transactions.map((item) =>
    [item.id, item.type, item.amount, item.category, item.note || "", item.date, item.createdAt || "", item.accountId || ""]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const csvWithBom = `\uFEFF${csv}`;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `小记账本_${liveMonth}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("CSV 已导出");
}

function applyBackupData(rawPayload, successMessage = "备份恢复成功") {
  const data = rawPayload && rawPayload.data ? rawPayload.data : rawPayload;
  if (!data || typeof data !== "object") {
    showToast("备份数据格式无效");
    return false;
  }
  const nextAccounts = Array.isArray(data.accounts) ? data.accounts : [];
  const nextTransactions = Array.isArray(data.transactions) ? data.transactions : [];
  const nextNotifications = Array.isArray(data.notifications) ? data.notifications : [];
  const nextBudgets = data.budgets && typeof data.budgets === "object" ? data.budgets : {};
  const nextSettings = data.settings && typeof data.settings === "object" ? data.settings : {};
  if (nextAccounts.length === 0) {
    showToast("备份中缺少账户数据");
    return false;
  }
  state.accounts = nextAccounts.map((item) => ({
    id: item.id || uid(),
    name: item.name || "未命名账户",
    type: item.type || "其他",
    balance: Number(item.balance || 0),
    openingBalance: item.openingBalance,
    lastFourDigits: item.lastFourDigits || "",
    createdAt: item.createdAt || new Date().toISOString(),
  }));
  const accountSet = new Set(state.accounts.map((item) => item.id));
  const fallbackId = state.accounts[0].id;
  state.transactions = nextTransactions.map((item) => ({
    id: item.id || uid(),
    type: item.type === "income" ? "income" : "expense",
    amount: Math.abs(Number(item.amount || 0)),
    category: item.category || "其他",
    note: item.note || "",
    date: item.date || getTodayString(),
    createdAt: item.createdAt || `${item.date || getTodayString()}T12:00:00`,
    accountId: item.accountId && accountSet.has(item.accountId) ? item.accountId : fallbackId,
  }));
  state.accounts = normalizeAccountsWithOpening(state.accounts, state.transactions);
  state.notifications = nextNotifications
    .map((item) => ({
      id: item.id || uid(),
      message: String(item.message || "").trim(),
      level: item.level || "info",
      read: Boolean(item.read),
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.message)
    .slice(0, 80);
  state.budgets = normalizeBudgetsMap(nextBudgets);
  state.settings = {
    ...state.settings,
    ...nextSettings,
  };
  if (typeof state.settings.lastReminderDate !== "string") state.settings.lastReminderDate = "";
  setupReminderScheduler();
  ensureValidAddAccount();
  closeAccountSheet();
  closeSettingsSheet();
  closeBudgetSheet();
  setRecordSelectionMode(false);
  setUndoDeleted(null);
  state.ui.tab = "home";
  persist();
  render();
  showToast(successMessage);
  return true;
}

function isBackupPayloadUsable(rawPayload) {
  const data = rawPayload && rawPayload.data ? rawPayload.data : rawPayload;
  if (!data || typeof data !== "object") return false;
  return Array.isArray(data.accounts) && data.accounts.length > 0;
}

function restoreBackupFromCloud() {
  const candidates = [
    { raw: localStorage.getItem(CLOUD_BACKUP_KEY), success: "云备份恢复成功" },
    { raw: localStorage.getItem(CLOUD_SHADOW_KEY), success: "自动云同步恢复成功" },
  ].filter((item) => Boolean(item.raw));
  if (candidates.length === 0) {
    showToast("暂无可恢复的云备份");
    return false;
  }
  let hadCorrupted = false;
  for (const item of candidates) {
    try {
      const payload = JSON.parse(item.raw);
      if (!isBackupPayloadUsable(payload)) {
        hadCorrupted = true;
        continue;
      }
      return applyBackupData(payload, item.success);
    } catch (error) {
      hadCorrupted = true;
      continue;
    }
  }
  if (hadCorrupted) {
    showToast("云备份数据已损坏");
    return false;
  }
  showToast("云备份不可用");
  return false;
}

function restoreBackupFromFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result || "{}"));
        if (!applyBackupData(raw, "备份恢复成功")) {
          return;
        }
      } catch (err) {
        showToast("备份文件解析失败");
      }
    };
    reader.readAsText(file, "utf-8");
  };
  input.click();
}

function handleSettingsAction(key) {
  if (key === "profile") {
    openSettingsSheet("profile");
    return;
  }
  if (key === "reminder") {
    openSettingsSheet("reminder");
    return;
  }
  if (key === "darkMode") {
    openSettingsSheet("darkMode");
    return;
  }
  if (key === "export") {
    exportCsv();
    return;
  }
  if (key === "rebuild-balance") {
    recalculateAccountBalances();
    persist();
    showToast("资产校准完成");
    return;
  }
  if (key === "backup") {
    const liveMonth = getCurrentMonthKey();
    const payload = buildBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `xiaojizhangben_backup_${liveMonth}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    if (saveManualCloudBackup()) {
      showToast("备份文件已导出，并已同步云备份");
    } else {
      showToast("备份文件已导出，云同步失败");
    }
    return;
  }
  if (key === "cloud-sync") {
    if (saveManualCloudBackup()) {
      showToast("云备份同步成功");
    } else {
      showToast("云备份同步失败");
    }
    return;
  }
  if (key === "cloud-restore") {
    if (confirm("将直接从云备份恢复并覆盖当前数据，是否继续？")) {
      restoreBackupFromCloud();
    }
    return;
  }
  if (key === "restore") {
    if (confirm("恢复备份会覆盖当前数据，是否继续？")) {
      const hasCloud = Boolean(localStorage.getItem(CLOUD_BACKUP_KEY) || localStorage.getItem(CLOUD_SHADOW_KEY));
      const meta = readCloudBackupMeta();
      let cloudHint = "检测到云备份";
      if (meta && meta.manual && meta.manual.cloudSyncedAt) {
        cloudHint = `检测到手动云备份（${formatMdHm(meta.manual.cloudSyncedAt)}）`;
      } else if (meta && meta.shadow && meta.shadow.cloudSyncedAt) {
        cloudHint = `检测到自动云同步快照（${formatMdHm(meta.shadow.cloudSyncedAt)}）`;
      }
      if (hasCloud && confirm(`${cloudHint}。点击“确定”直接恢复云备份；点击“取消”选择本地JSON文件。`)) {
        restoreBackupFromCloud();
      } else {
        restoreBackupFromFile();
      }
    }
    return;
  }
  if (key === "clear") {
    if (confirm("确认清除所有交易记录？此操作不可撤销。")) {
      state.transactions = [];
      setUndoDeleted(null);
      persist();
      showToast("记录已清空");
    }
    return;
  }
  if (key === "language") {
    openSettingsSheet("language");
  }
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("sheet-mask")) {
    if (state.ui.showAccountSheet) {
      closeAccountSheet();
      render();
      return;
    }
    if (state.ui.showSettingsSheet) {
      closeSettingsSheet();
      render();
      return;
    }
    if (state.ui.showBudgetSheet) {
      closeBudgetSheet();
      render();
      return;
    }
    if (state.ui.showNoticeSheet) {
      closeNoticeSheet();
      render();
      return;
    }
  }
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === "nav") {
    const tab = actionEl.dataset.tab;
    if (tab === "add") {
      openAddForCreate(state.ui.tab);
    } else {
      state.ui.tab = tab;
    }
    persist();
    render();
    return;
  }

  if (action === "open-records") {
    state.ui.recordMonth = getCurrentMonthKey();
    state.ui.recordFilter = "all";
    state.ui.recordKeyword = "";
    setRecordSelectionMode(false);
    state.ui.tab = "records";
    render();
    return;
  }
  if (action === "home-refresh") {
    triggerHomeRefresh();
    return;
  }
  if (action === "open-notice-sheet") {
    openNoticeSheet();
    render();
    return;
  }
  if (action === "open-reminder-settings") {
    closeNoticeSheet();
    openSettingsSheet("reminder");
    render();
    return;
  }
  if (action === "back-home") {
    setRecordSelectionMode(false);
    state.ui.tab = "home";
    render();
    return;
  }

  if (action === "open-account") {
    openAccountSheet(null);
    render();
    return;
  }
  if (action === "close-account-sheet") {
    closeAccountSheet();
    render();
    return;
  }
  if (action === "close-settings-sheet") {
    closeSettingsSheet();
    render();
    return;
  }
  if (action === "close-budget-sheet") {
    closeBudgetSheet();
    render();
    return;
  }
  if (action === "close-notice-sheet") {
    closeNoticeSheet();
    render();
    return;
  }
  if (action === "clear-notifications") {
    state.notifications = [];
    persist();
    showToast("消息已清空", { log: false });
    render();
    return;
  }
  if (action === "save-budget-sheet") {
    saveBudgetSheet();
    render();
    return;
  }
  if (action === "settings-select-avatar") {
    state.ui.settingsForm.avatar = actionEl.dataset.avatar;
    render();
    return;
  }
  if (action === "settings-toggle-reminder") {
    state.ui.settingsForm.reminderEnabled = !state.ui.settingsForm.reminderEnabled;
    render();
    return;
  }
  if (action === "request-notification-permission") {
    if (!("Notification" in window)) {
      showToast("当前环境不支持系统通知");
      render();
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showToast("系统通知已授权");
      } else if (permission === "denied") {
        showToast("你已拒绝系统通知");
      } else {
        showToast("通知授权已取消");
      }
      render();
    });
    return;
  }
  if (action === "settings-test-reminder") {
    const target = String(state.ui.settingsForm.reminderTime || state.settings.reminderTime || "20:00");
    remindNow(`测试提醒：当前 ${hhmmNow()}，目标 ${target}`);
    showToast("已触发一次测试提醒");
    render();
    return;
  }
  if (action === "settings-select-dark") {
    state.ui.settingsForm.darkMode = actionEl.dataset.mode;
    render();
    return;
  }
  if (action === "settings-select-language") {
    state.ui.settingsForm.language = actionEl.dataset.language;
    render();
    return;
  }
  if (action === "save-settings-sheet") {
    saveSettingsSheet();
    render();
    return;
  }
  if (action === "select-account-type") {
    state.ui.accountForm.type = actionEl.dataset.type;
    render();
    return;
  }
  if (action === "save-account") {
    const form = state.ui.accountForm;
    const rawBalance = Number(form.balance || 0);
    const balance = normalizeBalanceByType(form.type, rawBalance);
    if (!form.name.trim()) {
      showToast("请输入账户名称");
      render();
      return;
    }
    if (state.ui.editingAccountId) {
      const target = state.accounts.find((item) => item.id === state.ui.editingAccountId);
      if (target) {
        const net = accountTransactionNet(target.id);
        target.name = form.name.trim();
        target.type = form.type;
        target.balance = balance;
        target.openingBalance = balance - net;
        target.lastFourDigits = form.lastFourDigits.slice(0, 4);
      }
      showToast("账户已更新");
    } else {
      const newAccount = {
        id: uid(),
        name: form.name.trim(),
        type: form.type,
        balance,
        openingBalance: balance,
        lastFourDigits: form.lastFourDigits.slice(0, 4),
        createdAt: new Date().toISOString(),
      };
      state.accounts.unshift({
        ...newAccount,
      });
      state.ui.addAccountId = newAccount.id;
      showToast("账户已添加");
    }
    if (form.type === "信用卡" && rawBalance > 0) {
      showToast("信用卡余额已自动转为负数（欠款）");
    }
    closeAccountSheet();
    persist();
    render();
    return;
  }
  if (action === "edit-account") {
    openAccountSheet(actionEl.dataset.id);
    render();
    return;
  }
  if (action === "delete-account") {
    const id = actionEl.dataset.id;
    if (confirm("确认删除该账户？")) {
      const linkedCount = state.transactions.filter((item) => item.accountId === id).length;
      const target = state.accounts.find((item) => item.id === id) || null;
      const fallback = state.accounts.find((item) => item.id !== id) || null;
      if (linkedCount > 0 && !fallback) {
        showToast("该账户下有记录，至少保留一个账户");
        render();
        return;
      }
      if (linkedCount > 0 && fallback) {
        state.transactions.forEach((item) => {
          if (item.accountId === id) item.accountId = fallback.id;
        });
        fallback.openingBalance = Number(fallback.openingBalance || 0) + Number(target ? target.openingBalance || 0 : 0);
      }
      state.accounts = state.accounts.filter((item) => item.id !== id);
      ensureValidAddAccount();
      persist();
      showToast(linkedCount > 0 ? `账户已删除，${linkedCount} 条记录已迁移` : "账户已删除");
      render();
    }
    return;
  }
  if (action === "quick-category") {
    const cat = actionEl.dataset.category;
    openAddForCreate("home");
    state.ui.addCategory = cat === "更多" ? "餐饮" : cat;
    render();
    return;
  }
  if (action === "edit-record") {
    const recordId = actionEl.dataset.id;
    const from = actionEl.dataset.from || state.ui.tab || "home";
    openAddForEdit(recordId, from);
    render();
    return;
  }
  if (action === "stats-tab") {
    state.ui.statsTab = actionEl.dataset.tab;
    render();
    return;
  }
  if (action === "switch-add-type") {
    state.ui.addType = actionEl.dataset.type;
    const first = state.ui.addType === "expense" ? EXPENSE_CATEGORIES[0].name : INCOME_CATEGORIES[0].name;
    state.ui.addCategory = first;
    render();
    return;
  }
  if (action === "select-add-category") {
    state.ui.addCategory = actionEl.dataset.category;
    render();
    return;
  }
  if (action === "select-add-account") {
    state.ui.addAccountId = actionEl.dataset.id;
    render();
    return;
  }
  if (action === "set-record-filter") {
    state.ui.recordFilter = actionEl.dataset.filter || "all";
    setRecordSelectionMode(false);
    render();
    return;
  }
  if (action === "toggle-record-select-mode") {
    const mode = actionEl.dataset.mode || "toggle";
    if (mode === "on") {
      setRecordSelectionMode(true);
    } else if (mode === "off") {
      setRecordSelectionMode(false);
    } else {
      setRecordSelectionMode(!state.ui.recordSelectMode);
    }
    render();
    return;
  }
  if (action === "toggle-record-selected") {
    toggleRecordSelected(actionEl.dataset.id);
    render();
    return;
  }
  if (action === "select-all-visible-records") {
    const ids = getVisibleRecordIds(state.ui.recordMonth || getCurrentMonthKey(), state.ui.recordFilter || "all");
    const selected = new Set(state.ui.recordSelectedIds || []);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    if (allSelected) {
      setRecordSelection([]);
    } else {
      setRecordSelection(ids);
    }
    render();
    return;
  }
  if (action === "batch-delete-selected") {
    const ids = [...new Set(state.ui.recordSelectedIds || [])];
    if (ids.length === 0) {
      showToast("请先选择记录");
      render();
      return;
    }
    if (confirm(`确认删除选中的 ${ids.length} 条记录？`)) {
      const result = bulkDeleteRecords(ids);
      setRecordSelectionMode(false);
      setUndoDeleted(result.records);
      persist();
      showToast(`已删除 ${result.count} 条记录`);
      render();
    }
    return;
  }
  if (action === "batch-clone-selected") {
    const ids = [...new Set(state.ui.recordSelectedIds || [])];
    if (ids.length === 0) {
      showToast("请先选择记录");
      render();
      return;
    }
    const count = bulkCloneRecordsToToday(ids);
    setRecordSelectionMode(false);
    persist();
    showToast(`已复制 ${count} 条记录到今天`);
    render();
    return;
  }
  if (action === "copy-record") {
    const id = actionEl.dataset.id;
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx) {
      showToast("记录不存在");
      render();
      return;
    }
    const ok = cloneTransactionToToday(tx);
    if (ok) {
      persist();
      showToast("已复制记录到今天");
    }
    render();
    return;
  }
  if (action === "add-key") {
    applyKeyInput(actionEl.dataset.key);
    render();
    return;
  }
  if (action === "save-record") {
    saveRecord();
    render();
    return;
  }
  if (action === "add-back") {
    state.ui.editingRecordId = "";
    state.ui.tab = state.ui.addEntryFrom || "home";
    render();
    return;
  }
  if (action === "edit-total-budget") {
    const month = actionEl.dataset.month || state.ui.budgetMonth || getCurrentMonthKey();
    openBudgetSheet("total", month, "");
    render();
    return;
  }
  if (action === "edit-cat-budget") {
    const cat = actionEl.dataset.category;
    const month = actionEl.dataset.month || state.ui.budgetMonth || getCurrentMonthKey();
    openBudgetSheet("category", month, cat);
    render();
    return;
  }
  if (action === "delete-record") {
    const recordId = actionEl.dataset.id;
    if (confirm("确认删除这条记录？")) {
      const removed = deleteRecord(recordId);
      if (removed) {
        setUndoDeleted([removed]);
        persist();
        showToast("记录已删除");
      }
      render();
    }
    return;
  }
  if (action === "undo-delete-records") {
    const payload = state.ui.undoDeleted;
    const count = restoreDeletedRecords(payload);
    setUndoDeleted(null);
    persist();
    showToast(`已恢复 ${count} 条记录`);
    render();
    return;
  }
  if (action === "setting-action") {
    handleSettingsAction(actionEl.dataset.key);
    render();
  }
});

document.addEventListener("input", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  if (action === "account-input") {
    const field = event.target.dataset.field;
    state.ui.accountForm[field] = event.target.value;
    return;
  }
  if (action === "add-note-input") {
    state.ui.addNote = event.target.value;
    return;
  }
  if (action === "settings-input") {
    const field = event.target.dataset.field;
    state.ui.settingsForm[field] = event.target.value;
    return;
  }
  if (action === "budget-input") {
    const field = event.target.dataset.field;
    state.ui.budgetForm[field] = event.target.value;
    return;
  }
  if (action === "record-search-input") {
    state.ui.recordKeyword = event.target.value;
    setRecordSelectionMode(false);
    render();
  }
});

document.addEventListener("change", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  if (action === "change-month") {
    state.ui.selectedMonth = event.target.value;
    persist();
    render();
    return;
  }
  if (action === "change-record-month") {
    state.ui.recordMonth = event.target.value;
    state.ui.recordKeyword = "";
    setRecordSelectionMode(false);
    render();
    return;
  }
  if (action === "change-budget-month") {
    state.ui.budgetMonth = event.target.value;
    render();
    return;
  }
  if (action === "set-add-date") {
    state.ui.addDate = event.target.value || getTodayString();
    persist();
  }
});

document.addEventListener(
  "touchstart",
  (event) => {
    const scrollEl = shouldStartPullRefresh(event);
    if (!scrollEl) return;
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    pullRefresh.active = true;
    pullRefresh.startY = touch.clientY;
    pullRefresh.distance = 0;
    pullRefresh.scrollEl = scrollEl;
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!pullRefresh.active) return;
    if (!pullRefresh.scrollEl || pullRefresh.scrollEl.scrollTop > 0) {
      resetPullIndicator();
      return;
    }
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    const dy = touch.clientY - pullRefresh.startY;
    if (dy <= 0) {
      updatePullIndicator(0);
      return;
    }
    pullRefresh.distance = Math.min(120, dy * 0.62);
    updatePullIndicator(pullRefresh.distance);
    event.preventDefault();
  },
  { passive: false }
);

document.addEventListener(
  "touchend",
  () => {
    if (!pullRefresh.active) return;
    const shouldRefresh = pullRefresh.distance >= 72;
    resetPullIndicator();
    if (shouldRefresh) {
      triggerHomeRefresh();
    }
  },
  { passive: true }
);

if (window.matchMedia) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onThemeChange = () => {
    if (state.settings.darkMode === "system") {
      render();
    }
  };
  if (media.addEventListener) {
    media.addEventListener("change", onThemeChange);
  } else if (media.addListener) {
    media.addListener(onThemeChange);
  }
}

window.addEventListener("beforeunload", () => {
  if (reminderTimer) clearInterval(reminderTimer);
});

setupReminderScheduler();
syncCloudShadow();
render();
