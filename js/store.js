/* Хранилище: состояние, подписки, CRUD целей и операций */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var S = KP.storeSchema;
  var SCHEMA = S.SCHEMA;
  var KEY = S.KEY;
  var BACKUP = S.BACKUP;
  var BACKUP_AT = S.BACKUP_AT;
  var CORRUPT = S.CORRUPT;

  var state = null;
  var corrupt = null;
  var listeners = [];
  var saveTimer = null;
  var batchDepth = 0;
  var batchDirty = false;

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { state = S.defaultState(); return; }
    try {
      var parsed = JSON.parse(raw);
      S.validate(parsed);
      state = S.normalize(S.migrate(parsed));
      state.meta.lastOpenedAt = U.nowISO();
    } catch (e) {
      corrupt = { raw: raw, error: e && e.message ? e.message : String(e) };
      try { localStorage.setItem(CORRUPT, raw); } catch (ignore) { /* нет места */ }
      state = S.defaultState();
    }
  }

  function persistNow() {
    if (corrupt) return false;
    try {
      var prev = localStorage.getItem(KEY);
      if (prev) {
        var at = 0;
        try { at = Number(localStorage.getItem(BACKUP_AT)) || 0; } catch (e) { at = 0; }
        if (Date.now() - at > 6 * 3600 * 1000) {
          localStorage.setItem(BACKUP, prev);
          localStorage.setItem(BACKUP_AT, String(Date.now()));
        }
      }
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) { return false; }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 220);
  }

  function emit() {
    if (batchDepth > 0) { batchDirty = true; return; }
    listeners.slice().forEach(function (fn) {
      try { fn(state); } catch (e) { console.error('KP store listener:', e); }
    });
  }

  function batch(fn) {
    batchDepth++;
    try { fn(); } finally {
      batchDepth--;
      if (batchDepth === 0 && batchDirty) {
        batchDirty = false;
        scheduleSave();
        emit();
      }
    }
  }

  function update(fn) {
    try {
      fn(state);
      scheduleSave();
      emit();
      return true;
    } catch (e) {
      console.error('KP store update:', e);
      return false;
    }
  }

  function aliveGoals() { return state.goals.filter(function (g) { return !g.deletedAt; }); }
  function aliveTx() { return state.transactions.filter(function (t) { return !t.deletedAt; }); }
  function goalSort(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  }
  function txSort(a, b) {
    return new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt);
  }
  function calcBalance(txs, goalId) {
    var sum = 0;
    (txs || []).forEach(function (t) {
      if (t.deletedAt) return;
      if (t.goalId === goalId) sum += (t.type === 'withdraw' || t.type === 'transfer') ? -t.amount : t.amount;
      if (t.type === 'transfer' && t.toGoalId === goalId) sum += t.amount;
    });
    return sum;
  }

  var store = {
    SCHEMA: SCHEMA,
    init: function () {
      load();
      if (corrupt) return false;
      state.meta.lastOpenedAt = U.nowISO();
      scheduleSave();
      return true;
    },
    get: function () { return state; },
    settings: function () { return state.settings; },
    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
    },
    batch: batch,
    update: update,
    save: persistNow,
    corruptInfo: function () { return corrupt; },
    hasBackup: function () {
      try { return !!localStorage.getItem(BACKUP); } catch (e) { return false; }
    },
    recoverBackup: function () {
      var raw = null;
      try { raw = localStorage.getItem(BACKUP); } catch (e) { return false; }
      if (!raw) return false;
      try {
        var parsed = JSON.parse(raw);
        S.validate(parsed);
        state = S.normalize(S.migrate(parsed));
        corrupt = null;
        try { localStorage.removeItem(CORRUPT); } catch (ignore) { /* игнорируем */ }
        persistNow();
        emit();
        return true;
      } catch (e) { return false; }
    },
    discardCorrupt: function () {
      state = S.defaultState();
      corrupt = null;
      try {
        localStorage.removeItem(BACKUP);
        localStorage.removeItem(BACKUP_AT);
        localStorage.removeItem(CORRUPT);
        localStorage.removeItem(KEY);
      } catch (e) { /* игнорируем */ }
      persistNow();
      emit();
    },

    /* Цели */
    allGoals: function () { return aliveGoals().slice().sort(goalSort); },
    activeGoals: function () {
      return aliveGoals().filter(function (g) { return !g.archived; }).sort(goalSort);
    },
    archivedGoals: function () {
      return aliveGoals().filter(function (g) { return g.archived; }).sort(goalSort);
    },
    goal: function (id) {
      for (var i = 0; i < state.goals.length; i++) {
        if (state.goals[i].id === id && !state.goals[i].deletedAt) return state.goals[i];
      }
      return null;
    },
    addGoal: function (data) {
      var order = 0;
      aliveGoals().forEach(function (g) { order = Math.max(order, (g.order || 0) + 1); });
      var goal = Object.assign({
        id: U.uid(), title: 'Новая цель', emoji: '🎯', gradient: 'sunset', target: 0,
        priority: 'medium', deadline: null, pinned: false, order: order, archived: false,
        frozen: false, note: '', link: '', price: null, milestones: [],
        createdAt: U.nowISO(), completedAt: null, deletedAt: null, deletedTxIds: []
      }, data || {});
      goal.target = Math.max(0, Math.round(Number(goal.target) || 0));
      update(function (s) { s.goals.push(goal); });
      return goal;
    },
    updateGoal: function (id, patch) {
      var g = store.goal(id);
      if (!g) return null;
      update(function () {
        Object.keys(patch).forEach(function (k) {
          if (k === 'id' || k === 'deletedAt') return;
          g[k] = patch[k];
        });
      });
      return g;
    },
    deleteGoal: function (id) {
      var g = store.goal(id);
      if (!g) return;
      var now = U.nowISO();
      /* Переводы оставляем в журнале: удаление одной цели не меняет баланс другой. */
      var ids = aliveTx().filter(function (t) {
        return t.type !== 'transfer' && t.goalId === id;
      }).map(function (t) { return t.id; });
      update(function () {
        g.deletedAt = now;
        g.deletedTxIds = ids;
        ids.forEach(function (tid) {
          var t = store.tx(tid);
          if (t) t.deletedAt = now;
        });
      });
    },
    restoreGoal: function (id) {
      var g = null;
      state.goals.forEach(function (x) { if (x.id === id) g = x; });
      if (!g) return;
      update(function () {
        g.deletedAt = null;
        (g.deletedTxIds || []).forEach(function (tid) {
          var t = store.tx(tid);
          if (t) t.deletedAt = null;
        });
        g.deletedTxIds = [];
      });
    },
    togglePin: function (id) {
      var g = store.goal(id);
      if (g) update(function () { g.pinned = !g.pinned; });
    },
    setArchived: function (id, value) {
      var g = store.goal(id);
      if (g) update(function () { g.archived = !!value; });
    },
    reorderGoals: function (ids) {
      update(function () {
        ids.forEach(function (id, index) {
          var g = store.goal(id);
          if (g) g.order = index;
        });
      });
    },
    goalBalance: function (id) { return calcBalance(state.transactions, id); },
    total: function () {
      return aliveGoals().reduce(function (sum, g) { return sum + calcBalance(state.transactions, g.id); }, 0);
    },

    /* Операции */
    tx: function (id) {
      for (var i = 0; i < state.transactions.length; i++) if (state.transactions[i].id === id) return state.transactions[i];
      return null;
    },
    addTx: function (data) {
      var tx = Object.assign({
        id: U.uid(), type: 'deposit', goalId: null, toGoalId: null, amount: 0,
        categoryId: null, tags: [], note: '', date: U.nowISO(),
        createdAt: U.nowISO(), deletedAt: null
      }, data || {});
      tx.amount = Math.abs(Math.round(Number(tx.amount) || 0));
      update(function (s) { s.transactions.push(tx); });
      return tx;
    },
    updateTx: function (id, patch) {
      var t = store.tx(id);
      if (!t) return null;
      update(function () {
        Object.keys(patch).forEach(function (k) {
          if (k === 'id' || k === 'createdAt' || k === 'deletedAt') return;
          t[k] = patch[k];
        });
        if (patch.amount != null) t.amount = Math.abs(Math.round(Number(patch.amount) || 0));
      });
      return t;
    },
    deleteTx: function (id) {
      var t = store.tx(id);
      if (t) update(function () { t.deletedAt = U.nowISO(); });
    },
    restoreTx: function (id) {
      var t = store.tx(id);
      if (t) update(function () { t.deletedAt = null; });
    },
    transactions: function () { return aliveTx().slice().sort(txSort); },
    recentTransactions: function (limit) { return store.transactions().slice(0, limit || 5); },
    goalTransactions: function (goalId, limit) {
      var list = aliveTx().filter(function (t) { return t.goalId === goalId || t.toGoalId === goalId; }).sort(txSort);
      return limit ? list.slice(0, limit) : list;
    },

    /* Категории */
    categories: function () { return state.categories.slice(); },
    category: function (id) {
      for (var i = 0; i < state.categories.length; i++) if (state.categories[i].id === id) return state.categories[i];
      return state.categories[state.categories.length - 1] || { id: 'other', name: 'Другое', emoji: '📦', color: '#71717A' };
    },
    addCategory: function (name, emoji) {
      var palette = ['#FF9F43', '#5B8CFF', '#3DDC97', '#A78BFA', '#FF6FAE', '#FFDD2D', '#38BDF8', '#FB7185'];
      var cat = {
        id: 'cat-' + U.uid(), name: String(name || 'Своя категория').slice(0, 30),
        emoji: emoji || '🏷️', color: palette[state.categories.length % palette.length], builtin: false
      };
      update(function (s) { s.categories.push(cat); });
      return cat;
    },

    /* Настройки */
    updateSettings: function (patch) {
      update(function (s) { Object.assign(s.settings, patch); });
    },

    /* Импорт / экспорт / сброс */
    exportJSON: function () { return JSON.stringify(state, null, 2); },
    importJSON: function (text) {
      var parsed = JSON.parse(text);
      S.validate(parsed);
      var next = S.normalize(S.migrate(parsed));
      try {
        var prev = localStorage.getItem(KEY);
        if (prev) localStorage.setItem(BACKUP, prev);
      } catch (e) { /* игнорируем */ }
      state = next;
      corrupt = null;
      persistNow();
      emit();
      return state;
    },
    reset: function () {
      state = S.defaultState();
      corrupt = null;
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(BACKUP);
        localStorage.removeItem(BACKUP_AT);
      } catch (e) { /* игнорируем */ }
      persistNow();
      emit();
    },

    /* Служебные функции для selfTest и других модулей */
    _defaultState: S.defaultState,
    _calcBalance: calcBalance,
    _migrate: S.migrate,
    _aliveTx: aliveTx,
    _weeksToGoal: function (remaining, avgWeek) {
      if (!avgWeek || avgWeek <= 0) return null;
      return remaining / avgWeek;
    }
  };

  KP.store = store;
})(window.KP);
