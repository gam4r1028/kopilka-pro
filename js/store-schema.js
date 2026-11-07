/* Схема данных, значения по умолчанию и миграции */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var SCHEMA = 3;

  function defaultCategories() {
    return [
      { id: 'food', name: 'Еда', emoji: '🍔', color: '#FF9F43', builtin: true },
      { id: 'transport', name: 'Транспорт', emoji: '🚕', color: '#5B8CFF', builtin: true },
      { id: 'home', name: 'Дом', emoji: '🏠', color: '#3DDC97', builtin: true },
      { id: 'fun', name: 'Развлечения', emoji: '🎮', color: '#A78BFA', builtin: true },
      { id: 'health', name: 'Здоровье', emoji: '💊', color: '#FF6FAE', builtin: true },
      { id: 'shopping', name: 'Покупки', emoji: '🛍️', color: '#38BDF8', builtin: true },
      { id: 'bills', name: 'Счета', emoji: '🧾', color: '#FFDD2D', builtin: true },
      { id: 'other', name: 'Другое', emoji: '📦', color: '#71717A', builtin: true }
    ];
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA,
      settings: {
        name: '', currency: 'RUB', theme: 'dark', accent: 'yellow',
        hideAmounts: false, dateFormat: 'dd.mm.yyyy', onboardingDone: false,
        pinHash: null, pinEnabled: false, autoLockMin: 0, lastBackupAt: null
      },
      goals: [], transactions: [], categories: defaultCategories(),
      autoRules: [], challenges: [], limits: [], achievements: [],
      meta: { createdAt: U.nowISO(), lastOpenedAt: U.nowISO() }
    };
  }

  function validate(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('Данные не являются объектом');
    if (!Array.isArray(s.goals) || !Array.isArray(s.transactions)) throw new Error('Повреждена структура данных');
    if (!s.settings || typeof s.settings !== 'object') throw new Error('В данных нет настроек');
    if (typeof s.schemaVersion !== 'number') s.schemaVersion = 1;
    if (s.schemaVersion > SCHEMA) throw new Error('Данные созданы более новой версией приложения');
  }

  function migrate(s) {
    var v = s.schemaVersion || 1;
    if (v < 2) {
      (s.goals || []).forEach(function (g) { if (typeof g.target === 'number') g.target = Math.round(g.target * 100); });
      (s.transactions || []).forEach(function (t) { if (typeof t.amount === 'number') t.amount = Math.round(t.amount * 100); });
      s.schemaVersion = 2;
      v = 2;
    }
    if (v < 3) {
      s.categories = Array.isArray(s.categories) && s.categories.length ? s.categories : defaultCategories();
      (s.goals || []).forEach(function (g, i) {
        if (!Array.isArray(g.milestones)) g.milestones = [];
        if (typeof g.order !== 'number') g.order = i;
        g.pinned = !!g.pinned;
        g.archived = !!g.archived;
        g.frozen = !!g.frozen;
        g.note = g.note || '';
        g.link = g.link || '';
        g.price = g.price == null ? null : g.price;
      });
      s.autoRules = s.autoRules || [];
      s.challenges = s.challenges || [];
      s.limits = s.limits || [];
      s.achievements = s.achievements || [];
      s.settings.accent = s.settings.accent || 'yellow';
      s.settings.theme = s.settings.theme || 'dark';
      s.settings.dateFormat = s.settings.dateFormat || 'dd.mm.yyyy';
      s.settings.hideAmounts = !!s.settings.hideAmounts;
      s.settings.currency = s.settings.currency || 'RUB';
      s.settings.name = s.settings.name || '';
      s.settings.onboardingDone = !!s.settings.onboardingDone;
      s.schemaVersion = 3;
    }
    return s;
  }

  function normalize(s) {
    var d = defaultState();
    s.settings = Object.assign({}, d.settings, s.settings || {});
    s.goals = (Array.isArray(s.goals) ? s.goals : []).map(function (g, i) {
      var goal = Object.assign({
        id: U.uid(), title: 'Цель', emoji: '🎯', gradient: 'sunset', target: 0,
        priority: 'medium', deadline: null, pinned: false, order: i, archived: false,
        frozen: false, note: '', link: '', price: null, milestones: [],
        createdAt: U.nowISO(), completedAt: null, deletedAt: null, deletedTxIds: []
      }, g);
      goal.target = Math.max(0, Math.round(Number(goal.target) || 0));
      goal.order = typeof goal.order === 'number' ? goal.order : i;
      goal.milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
      goal.deletedTxIds = Array.isArray(goal.deletedTxIds) ? goal.deletedTxIds : [];
      /* Защита от подмены класса обложки и приоритета импортированными данными */
      if (U.GRADIENTS.indexOf(goal.gradient) < 0) goal.gradient = 'sunset';
      if (['low', 'medium', 'high'].indexOf(goal.priority) < 0) goal.priority = 'medium';
      return goal;
    });
    s.transactions = (Array.isArray(s.transactions) ? s.transactions : []).map(function (t) {
      var tx = Object.assign({
        id: U.uid(), type: 'deposit', goalId: null, toGoalId: null, amount: 0,
        categoryId: null, tags: [], note: '', date: U.nowISO(),
        createdAt: U.nowISO(), deletedAt: null
      }, t);
      tx.amount = Math.abs(Math.round(Number(tx.amount) || 0));
      if (['deposit', 'withdraw', 'transfer'].indexOf(tx.type) < 0) tx.type = 'deposit';
      tx.tags = Array.isArray(tx.tags) ? tx.tags.filter(Boolean) : [];
      return tx;
    });
    s.categories = (Array.isArray(s.categories) && s.categories.length ? s.categories : defaultCategories()).map(function (c, i) {
      var cat = Object.assign({ id: 'cat-' + i, name: 'Другое', emoji: '📦', color: '#71717A', builtin: false }, c);
      cat.id = String(cat.id || ('cat-' + i));
      cat.name = String(cat.name || 'Другое').slice(0, 30);
      cat.emoji = String(cat.emoji || '📦');
      cat.color = /^#[0-9a-f]{3,8}$/i.test(String(cat.color || '')) ? cat.color : '#71717A';
      return cat;
    });
    s.autoRules = Array.isArray(s.autoRules) ? s.autoRules : [];
    s.challenges = Array.isArray(s.challenges) ? s.challenges : [];
    s.limits = Array.isArray(s.limits) ? s.limits : [];
    s.achievements = Array.isArray(s.achievements) ? s.achievements : [];
    s.meta = Object.assign({ createdAt: U.nowISO(), lastOpenedAt: U.nowISO() }, s.meta || {});
    s.schemaVersion = SCHEMA;
    return s;
  }

  KP.storeSchema = {
    SCHEMA: SCHEMA,
    KEY: 'kopilka_state',
    BACKUP: 'kopilka_backup',
    BACKUP_AT: 'kopilka_backup_at',
    CORRUPT: 'kopilka_corrupt',
    defaultCategories: defaultCategories,
    defaultState: defaultState,
    validate: validate,
    migrate: migrate,
    normalize: normalize
  };
})(window.KP);
