/* Фильтры каталога продукта (/roadmap/, секция #features-plan) — единый дом.
   Подключён как <script src="../assets/roadmap-features.js" defer>.
   Логика: all | done | notdone, скрытие пустых категорий, пересчёт счётчиков
   data-count / data-cat-count / data-feat-shown и aria-pressed.
   ПАТТЕРН ДЛЯ АГЕНТОВ: инлайн-скрипты длиннее 3 строк запрещены — страница
   подключает файл, а не держит код у себя (AGENTS.md, «общий код в assets/»). */
(function () {
  'use strict';

  const root = document.getElementById('features-plan');
  if (!root) return;
  const items = Array.from(root.querySelectorAll('.fp li[data-status]'));
  const cats = Array.from(root.querySelectorAll('.fp'));
  const buttons = Array.from(root.querySelectorAll('.feat-filter'));
  const shown = root.querySelector('[data-feat-shown]');
  const counts = { all: items.length, done: 0, work: 0, plan: 0 };
  items.forEach(li => { counts[li.dataset.status] = (counts[li.dataset.status] || 0) + 1; });
  const notdone = counts.work + counts.plan;
  const set = (sel, val) => root.querySelectorAll(sel).forEach(el => { el.textContent = val; });
  set('[data-count="all"]', counts.all);
  set('[data-count="done"]', counts.done);
  set('[data-count="notdone"]', notdone);
  set('[data-feat-total]', counts.all);
  set('[data-feat-done-text]', counts.done);
  set('[data-feat-work-text]', counts.work);
  set('[data-feat-plan-text]', counts.plan);
  const statDone = document.querySelector('[data-feat-done-stat]');
  const statAhead = document.querySelector('[data-feat-ahead-stat]');
  if (statDone) statDone.textContent = counts.done;
  if (statAhead) statAhead.textContent = notdone;
  const planBtn = root.querySelector('.feat-filter[data-filter="notdone"]');
  if (planBtn) planBtn.title = `Включая ${counts.work} фич в работе`;
  const apply = (filter) => {
    let visible = 0;
    items.forEach(li => {
      const ok = filter === 'all' || (filter === 'done' ? li.dataset.status === 'done' : li.dataset.status !== 'done');
      li.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });
    cats.forEach(cat => {
      const n = cat.querySelectorAll('li[data-status]:not(.is-hidden)').length;
      const count = cat.querySelector('[data-cat-count]');
      if (count) count.textContent = n;
      cat.hidden = n === 0;
    });
    buttons.forEach(btn => {
      const on = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    if (shown) shown.textContent = `Показано ${visible} из ${items.length}`;
  };
  buttons.forEach(btn => btn.addEventListener('click', () => apply(btn.dataset.filter)));
  apply('all');
})();
