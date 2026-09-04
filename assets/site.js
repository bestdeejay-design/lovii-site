/* site.js — каркас lovii-site (превью нового lovii.ru)
   Тема: канон ДС «Лови» (anti-FOUC инит — инлайн в <head>, здесь — переключение).
   Формы-лиды: mailto-паттерн без хранения ПДн (152-ФЗ), как в исходном сайте. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Тема ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('lovii_theme', t); } catch (e) {}
    var m = document.getElementById('metaTheme');
    if (m) m.setAttribute('content', t === 'dark' ? '#171219' : '#f64a8a');
  }
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var links = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', closeMenu);
  }

  /* ---------- Reveal-каскад секций ---------- */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    for (var r = 0; r < rvs.length; r++) io.observe(rvs[r]);
  } else {
    for (var r2 = 0; r2 < rvs.length; r2++) rvs[r2].classList.add('revealed');
  }

  /* ---------- Кнопка «наверх» ---------- */
  var upBtn = document.getElementById('upBtn');
  if (upBtn) {
    var onScroll = function () { upBtn.classList.toggle('show', window.scrollY > 480); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    upBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- Тост (канон ДС §7) ---------- */
  var toastTimer = null;
  function showToast(msg) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var old = wrap.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    wrap.appendChild(t);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- Формы-лиды (mailto, без ПДн) ---------- */
  var EMAIL = 'hello@lovii.ru';
  var forms = document.querySelectorAll('form[data-lead]');
  for (var f = 0; f < forms.length; f++) initLeadForm(forms[f]);

  function initLeadForm(form) {
    var cfgEl = form.querySelector('script[type="application/json"]');
    var cfg = {};
    try { cfg = JSON.parse(cfgEl ? cfgEl.textContent : '{}'); } catch (e) { cfg = {}; }
    var role = cfg.role || 'Партнёр';
    var consent = form.querySelector('input[name="consent"]');
    var consentBox = form.querySelector('.consent');
    var consentErr = form.querySelector('.form-err');
    var fields = form.querySelectorAll('[data-fname]');

    function composed() {
      var lines = ['Заявка на lovii.ru · Роль: ' + role, ''];
      fields.forEach(function (el) {
        var v = el.value.trim();
        if (v) lines.push(el.getAttribute('data-label') + ': ' + v);
      });
      return lines.join('\n');
    }
    function mailtoUrl() {
      return 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent('LOVII — заявка: ' + role) +
        '&body=' + encodeURIComponent(composed());
    }

    fields.forEach(function (el) {
      el.addEventListener('input', function () {
        var ff = el.closest('.f-field');
        if (ff && el.value.trim()) ff.classList.remove('error');
      });
    });
    if (consent) consent.addEventListener('change', function () {
      if (consent.checked && consentBox) consentBox.classList.remove('error');
      if (consent.checked && consentErr) consentErr.classList.remove('show');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      fields.forEach(function (el) {
        if (el.hasAttribute('data-required') && !el.value.trim()) {
          var ff = el.closest('.f-field');
          if (ff) ff.classList.add('error');
          ok = false;
        }
      });
      if (!consent || !consent.checked) {
        if (consentBox) consentBox.classList.add('error');
        if (consentErr) consentErr.classList.add('show');
        ok = false;
      }
      if (!ok) return;
      var url = mailtoUrl();
      window.location.href = url;
      showSent(url);
    });

    function showSent(url) {
      var panel = form.closest('.lead-card');
      if (!panel) return;
      var sent = document.createElement('div');
      sent.setAttribute('data-lead-form', '');
      sent.innerHTML =
        '<div class="ico-badge t-tiffany" style="margin-bottom:14px"><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-check"></use></svg></div>' +
        '<h3>Черновик письма готов</h3>' +
        '<p class="lsub">Если почтовый клиент не открылся автоматически — скопируйте текст ниже и отправьте на ' +
        '<a href="mailto:' + EMAIL + '" style="color:var(--lv-pink-dark);font-weight:700">' + EMAIL + '</a>' +
        ' — команда LOVII ответит и подключит вас в роли «' + role + '».</p>' +
        '<pre class="sent-pre"></pre>' +
        '<div class="sent-actions">' +
        '<a class="btn btn-primary" href="' + url.replace(/"/g, '&quot;') + '"><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-mail"></use></svg>Открыть почтовый клиент</a>' +
        '<button type="button" class="btn btn-outline" data-copy><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-copy"></use></svg>Скопировать текст</button>' +
        '<button type="button" class="btn btn-soft" data-again>Заполнить ещё раз</button>' +
        '</div>';
      sent.querySelector('.sent-pre').textContent = composed();
      form.style.display = 'none';
      panel.appendChild(sent);
      sent.querySelector('[data-copy]').addEventListener('click', function () {
        var txt = sent.querySelector('.sent-pre').textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () { showToast('Текст заявки скопирован'); },
            function () { showToast('Не удалось скопировать — выделите текст вручную'); });
        } else { showToast('Не удалось скопировать — выделите текст вручную'); }
      });
      sent.querySelector('[data-again]').addEventListener('click', function () {
        sent.remove();
        form.style.display = '';
        form.reset();
        fields.forEach(function (el) { var ff = el.closest('.f-field'); if (ff) ff.classList.remove('error'); });
        form.querySelector('input, textarea') && form.querySelector('input, textarea').focus();
      });
    }
  }

  function spriteBase() {
    return (document.body && document.body.dataset.sprite) || 'assets/icons.svg';
  }
})();
