/* site.js — каркас lovii-site (превью нового lovii.ru)
   Тема: канон ДС «Лови» (anti-FOUC инит — инлайн в <head>, здесь — переключение).
   Формы-лиды: mailto-паттерн без хранения ПДн (152-ФЗ), как в исходном сайте.
   v2: продуктовые улучшения — калькуляторы, UTM, draft, аналитика, sticky CTA, прогресс. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Утилиты ---------- */
  function qs(s, r){ return (r||document).querySelector(s); }
  function qsa(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function fmt(n){ return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }
  function spriteBase() { return (document.body && document.body.dataset.sprite) || 'assets/icons.svg'; }

  /* ---------- Тема ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('lovii_theme', t); } catch (e) {}
    var m = document.getElementById('metaTheme');
    if (m) m.setAttribute('content', t === 'dark' ? '#171219' : '#f64a8a');
  }
  try {
    var savedTheme = localStorage.getItem('lovii_theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (prefersDark ? 'dark' : 'light'));
  } catch (e) { applyTheme('light'); }
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    track('theme_toggle', { theme: document.documentElement.getAttribute('data-theme') });
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
      track('menu_toggle', { open: open });
    });
    var links = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', closeMenu);
  }

  /* ---------- Scroll progress + sticky CTA + reveal ---------- */
  var progress = qs('#scrollProgress i');
  var sticky = qs('#stickyCta');
  var upBtn = document.getElementById('upBtn');
  var rvs = qsa('.rv');
  var onScroll = function () {
    var h = document.documentElement;
    var scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if (progress) progress.style.width = scrolled + '%';
    if (upBtn) upBtn.classList.toggle('show', window.scrollY > 480);
    if (sticky) sticky.classList.toggle('show', window.scrollY > 900 && window.scrollY < (document.body.scrollHeight - 1400));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (upBtn) upBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); track('up_click'); });

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

  /* ---------- Тост ---------- */
  var toastTimer = null;
  function showToast(msg) {
    var wrap = qs('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    var old = wrap.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); t.textContent = msg; wrap.appendChild(t);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2800);
  }

  /* ---------- Продуктовая аналитика (без внешних скриптов) ---------- */
  function track(name, props) {
    try {
      var payload = { event: name, props: props||{}, ts: Date.now(), path: location.pathname, utm: window.__LOVII_UTM||{} };
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
      if (window.console && console.debug) console.debug('[lovii-track]', payload);
      var q = []; try { q = JSON.parse(localStorage.getItem('lovii_events')||'[]'); } catch(e){}
      q.push(payload); if (q.length>120) q = q.slice(-120);
      try { localStorage.setItem('lovii_events', JSON.stringify(q)); } catch(e){}
    } catch(e){}
  }
  window.loviiTrack = track;
  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-analytics]');
    if (!a) return;
    track(a.getAttribute('data-analytics'), { href: a.getAttribute('href')||'', text: (a.textContent||'').trim().slice(0,60) });
  });

  /* ---------- UTM capture ---------- */
  (function(){
    try {
      var p = new URLSearchParams(location.search);
      var utm = {};
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref','promo'].forEach(function(k){
        if (p.get(k)) utm[k]=p.get(k);
      });
      if (Object.keys(utm).length) {
        window.__LOVII_UTM = utm;
        try { localStorage.setItem('lovii_utm', JSON.stringify(utm)); } catch(e){}
        var badge = qs('#utmBadge');
        if (badge && (utm.promo || utm.utm_campaign)) {
          badge.textContent = 'Промо: ' + (utm.promo || utm.utm_campaign);
          badge.style.display = 'inline-flex';
        }
      } else {
        try { window.__LOVII_UTM = JSON.parse(localStorage.getItem('lovii_utm')||'{}'); } catch(e){ window.__LOVII_UTM={}; }
      }
    } catch(e){ window.__LOVII_UTM={}; }
  })();

  /* ---------- Калькуляторы ---------- */
  function initCalculators(){
    var biz = qs('[data-calc="business"]');
    if (biz) {
      var gmv = qs('[data-biz="gmv"]', biz);
      var agg = qs('[data-biz="agg"]', biz);
      var outSave = qs('[data-biz-out="save"]', biz);
      var outYear = qs('[data-biz-out="year"]', biz);
      var outLovii = qs('[data-biz-out="lovii"]', biz);
      var outAggCost = qs('[data-biz-out="aggcost"]', biz);
      var gmvVal = qs('[data-biz-val="gmv"]', biz);
      var aggVal = qs('[data-biz-val="agg"]', biz);
      function recalcBiz(){
        var g = parseInt(gmv.value,10);
        var a = parseInt(agg.value,10);
        var loviiFee = Math.round(g*0.10);
        var aggCost = Math.round(g*a/100);
        var save = aggCost - loviiFee;
        if (gmvVal) gmvVal.textContent = fmt(g)+' ₽';
        if (aggVal) aggVal.textContent = a+'%';
        if (outLovii) outLovii.textContent = fmt(loviiFee)+' ₽';
        if (outAggCost) outAggCost.textContent = fmt(aggCost)+' ₽';
        if (outSave) outSave.textContent = fmt(save)+' ₽';
        if (outYear) outYear.textContent = fmt(save*12)+' ₽';
      }
      gmv.addEventListener('input', recalcBiz); agg.addEventListener('input', recalcBiz); recalcBiz();
      biz.addEventListener('input', function(){ track('calc_business', { gmv: gmv.value, agg: agg.value }); });
    }
    var part = qs('[data-calc="partners"]');
    if (part) {
      var cnt = qs('[data-part="count"]', part);
      var avg = qs('[data-part="avg"]', part);
      var cb = qs('[data-part="cb"]', part);
      var cntV = qs('[data-part-val="count"]', part);
      var avgV = qs('[data-part-val="avg"]', part);
      var cbV = qs('[data-part-val="cb"]', part);
      var outGmv = qs('[data-part-out="gmv"]', part);
      var outPool = qs('[data-part-out="pool"]', part);
      var outIncome = qs('[data-part-out="income"]', part);
      var outCb = qs('[data-part-out="cb"]', part);
      var outTotal = qs('[data-part-out="total"]', part);
      function recalcPart(){
        var c = parseInt(cnt.value,10);
        var g = parseInt(avg.value,10);
        var cbp = parseInt(cb.value,10);
        var gmvNet = g * c;
        var poolOne = g * 0.0684;
        var pool = poolOne * c;
        var income = pool * 0.40;
        var cbIncome = (g * cbp/100 * 0.10) * c;
        if (cntV) cntV.textContent = fmt(c);
        if (avgV) avgV.textContent = fmt(g)+' ₽';
        if (cbV) cbV.textContent = cbp+'%';
        if (outGmv) outGmv.textContent = fmt(gmvNet)+' ₽';
        if (outPool) outPool.textContent = fmt(pool)+' ₽';
        if (outIncome) outIncome.textContent = fmt(income)+' ₽';
        if (outCb) outCb.textContent = fmt(cbIncome)+' ₽';
        if (outTotal) outTotal.textContent = fmt(income+cbIncome)+' ₽';
      }
      cnt.addEventListener('input', recalcPart); avg.addEventListener('input', recalcPart); cb.addEventListener('input', recalcPart); recalcPart();
      part.addEventListener('input', function(){ track('calc_partners', { count: cnt.value }); });
    }
    var cli = qs('[data-calc="clients"]');
    if (cli) {
      var spend = qs('[data-cli="spend"]', cli);
      var perc = qs('[data-cli="perc"]', cli);
      var spendV = qs('[data-cli-val="spend"]', cli);
      var percV = qs('[data-cli-val="perc"]', cli);
      var outMonth = qs('[data-cli-out="month"]', cli);
      var outYearC = qs('[data-cli-out="year"]', cli);
      function recalcCli(){
        var s = parseInt(spend.value,10);
        var p = parseInt(perc.value,10);
        var m = s * p/100;
        if (spendV) spendV.textContent = fmt(s)+' ₽';
        if (percV) percV.textContent = p+'%';
        if (outMonth) outMonth.textContent = fmt(m)+' ₽';
        if (outYearC) outYearC.textContent = fmt(m*12)+' ₽';
      }
      spend.addEventListener('input', recalcCli); perc.addEventListener('input', recalcCli); recalcCli();
      cli.addEventListener('input', function(){ track('calc_clients', { spend: spend.value }); });
    }
    var amb = qs('[data-calc="amb"]');
    if (amb) {
      var reps = qs('[data-amb="reps"]', amb);
      var pts = qs('[data-amb="pts"]', amb);
      var repsV = qs('[data-amb-val="reps"]', amb);
      var ptsV = qs('[data-amb-val="pts"]', amb);
      var outNet = qs('[data-amb-out="net"]', amb);
      var outInc = qs('[data-amb-out="inc"]', amb);
      function recalcAmb(){
        var r = parseInt(reps.value,10);
        var p = parseInt(pts.value,10);
        var totalPts = r * p;
        var pool = totalPts * 144000 * 0.0684;
        var inc = pool * 0.20;
        if (repsV) repsV.textContent = r;
        if (ptsV) ptsV.textContent = p;
        if (outNet) outNet.textContent = totalPts;
        if (outInc) outInc.textContent = fmt(inc)+' ₽';
      }
      reps.addEventListener('input', recalcAmb); pts.addEventListener('input', recalcAmb); recalcAmb();
    }
  }
  initCalculators();
  initDemoSync();

  /* ---------- Demo-sync rendering (from lovii-demo/js/data.js) ---------- */
  function initDemoSync(){
    var D = window.LOVII_DEMO;
    if (!D) return;
    // stores
    var storeMounts = qsa('[data-demo=\"stores\"]');
    storeMounts.forEach(function(el){
      var limit = parseInt(el.getAttribute('data-limit')||'6',10);
      var district = el.getAttribute('data-district')||'';
      var list = D.stores;
      if (district) list = list.filter(function(s){ return s.districtId===district; });
      list = list.slice(0, limit);
      el.innerHTML = list.map(function(s){
        var meta = [];
        if (s.walk) meta.push(s.walk);
        if (s.minOrder) meta.push('от '+s.minOrder+'₽');
        if (s.rating) meta.push('★ '+s.rating);
        var badges = meta.map(function(m){ return '<span>'+m+'</span>'; }).join('');
        return '<div class=\"demo-store-card\"><div class=\"em-tile '+ (s.color||'pink')+'\">'+ (s.emoji||'🛍️')+'</div><div style=\"min-width:0;flex:1\"><div class=\"nm\">'+s.name+'</div><div class=\"sb\">'+ (s.addr||'')+' · '+ (s.catLabel||'')+'</div><div class=\"meta\">'+badges+'</div></div></div>';
      }).join('');
    });
    // products
    var prodMounts = qsa('[data-demo=\"products\"]');
    prodMounts.forEach(function(el){
      var limit = parseInt(el.getAttribute('data-limit')||'4',10);
      var list = (D.products||[]).slice(0,limit);
      el.innerHTML = '<div class="grid g3">'+ list.map(function(p){
        return '<div class=\"card\" style=\"padding:14px;display:flex;gap:12px;align-items:center\"><div style=\"width:52px;height:52px;border-radius:12px;background:var(--lv-surface);display:flex;align-items:center;justify-content:center;font-size:26px;flex:none\">'+ (p.emoji||'🛒')+'</div><div style=\"min-width:0;flex:1\"><div style=\"font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">'+p.name+'</div><div style=\"font-size:11px;color:var(--lv-dim)\">'+ (p.storeName||'')+' · '+ (p.catLabel||'')+'</div><div style=\"margin-top:4px;display:flex;gap:6px;align-items:center\"><b style=\"font-size:13px\">'+ (p.price||0)+'₽</b>'+ (p.oldPrice?'<span style=\"font-size:11px;color:var(--lv-dim);text-decoration:line-through\">'+p.oldPrice+'₽</span>':'')+ (p.badge?'<span class=\"calc-badge\">'+p.badge+'</span>':'')+'</div></div></div>';
      }).join('')+'</div>';
    });
    // promos
    var promoMounts = qsa('[data-demo=\"promos\"]');
    promoMounts.forEach(function(el){
      var limit = parseInt(el.getAttribute('data-limit')||'3',10);
      var list = (D.promos||[]).slice(0,limit);
      el.innerHTML = '<div class=\"promo-grid\">'+ list.map(function(pr){
        return '<div class=\"promo-card-demo tone-'+ (pr.tone||'pink')+'\"><div style=\"font-size:13px;font-weight:800\">'+pr.title+'</div><div style=\"font-size:12px;color:var(--lv-dim);margin-top:4px\">'+pr.desc+'</div><div style=\"margin-top:8px;display:flex;gap:6px\"><span class=\"calc-badge\">'+pr.tag+'</span><span class=\"calc-badge\" style=\"background:var(--lv-card)\">'+pr.code+'</span></div></div>';
      }).join('')+'</div>';
    });
    // paycard — клик: 360°-разворот со сменой скина (PAY → PASS → VIP → BIZ)
    var payMounts = qsa('[data-demo=\"paycard\"]');
    payMounts.forEach(function(el){
      var pay = D.pay;
      if (!pay || !pay.cardSkins || !pay.cardSkins.length) return;
      var skins = pay.cardSkins;
      var startId = el.getAttribute('data-skin')||'pay';
      var idx = 0;
      for (var i=0;i<skins.length;i++){ if (skins[i].id===startId){ idx=i; break; } }
      var btn, capEl;
      function labelOf(s){ return s.tag+' карта — нажмите, чтобы сменить скин'; }
      function capOf(s){ return '<b>'+s.tag+'</b> — '+s.who+'. Нажмите на карту — следующий скин.'; }
      function applySkin(i){
        idx = (i+skins.length)%skins.length;
        var s = skins[idx];
        for (var k=0;k<skins.length;k++) btn.classList.remove(skins[k].cls);
        btn.classList.add(s.cls);
        btn.setAttribute('aria-label', labelOf(s));
        var brand = btn.querySelector('.pay-brand');
        if (brand) brand.textContent = s.tag.replace(' ',' · ');
        if (capEl) capEl.innerHTML = capOf(s);
      }
      var cur = skins[idx];
      el.innerHTML = '<div class=\"pay-stage\"><div class=\"pay-tilt\"><button class=\"paycard '+cur.cls+'\" type=\"button\" aria-label=\"'+labelOf(cur)+'\" data-card><div class=\"pay-face pay-front\"><span class=\"pay-sheen\" aria-hidden=\"true\"></span><span class=\"pay-glare\" aria-hidden=\"true\"></span><span class=\"pay-sweep\" aria-hidden=\"true\"></span><div class=\"pay-top\"><span class=\"pay-brand\">'+cur.tag.replace(' ',' · ')+'</span><span class=\"pay-chip\" aria-hidden=\"true\"></span></div><div class=\"pay-num\">'+pay.formatted+'</div><div class=\"pay-bot\"><div><span class=\"lbl\">Держатель</span><span class=\"val\">'+pay.holder+'</span></div><div class=\"pay-bal\"><span class=\"lbl\">Баланс</span><span class=\"val\">'+ (pay.rub||0).toLocaleString('ru-RU')+' ₽</span></div></div></div><div class=\"pay-face pay-back\" aria-hidden=\"true\"><span class=\"pay-back-logo\">LOVII</span></div></button></div><div class=\"pay-skin-note\" data-skin-cap>'+capOf(cur)+'</div></div>';
      btn = el.querySelector('[data-card]');
      capEl = el.querySelector('[data-skin-cap]');
      if (btn) btn.addEventListener('click', function(){
        if (btn.dataset.busy) return;
        var next = (idx+1)%skins.length;
        track('paycard_skin', { skin: skins[next].id });
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced){ applySkin(next); return; }
        btn.dataset.busy = '1';
        btn.classList.add('spinning');
        setTimeout(function(){ applySkin(next); }, 350);
        setTimeout(function(){ btn.classList.remove('spinning'); delete btn.dataset.busy; }, 720);
      });
    });
    // tx list
    var txMounts = qsa('[data-demo=\"tx\"]');
    txMounts.forEach(function(el){
      var limit = parseInt(el.getAttribute('data-limit')||'5',10);
      var list = (D.pay && D.pay.tx ? D.pay.tx.slice(0,limit) : []);
      el.innerHTML = '<div class=\"card\" style=\"padding:14px 18px\"><div class=\"tx-list\">'+ list.map(function(t){
        var icoClass = t.type==='buy'?'buy':(t.type==='in'?'in':'out');
        var sign = t.type==='in'?'+':'';
        return '<div class=\"tx-row\"><div class=\"tx-ico '+icoClass+'\">'+ (t.emoji||'•')+'</div><div style=\"min-width:0;flex:1\"><div class=\"tx-name\">'+t.name+'</div><div class=\"tx-meta\">'+t.time+' · '+(t.method||'')+'</div></div><div class=\"tx-sum '+(t.type==='in'?'plus':'')+'\">'+sign+t.sum+' '+ (t.unit||'')+'</div></div>';
      }).join('')+'</div></div>';
    });
    // districts chips
    var distMounts = qsa('[data-demo=\"districts\"]');
    distMounts.forEach(function(el){
      el.innerHTML = (D.districts||[]).map(function(d){ return '<span class="st-chip"><span style="width:8px;height:8px;border-radius:50%;background:'+d.color+';display:inline-block"></span>'+d.name+'</span>'; }).join(' ');
    });
    // investor stats
    var invMounts = qsa('[data-demo=\"investor-kpi\"]');
    invMounts.forEach(function(el){
      var inv = D.investor;
      if (!inv) return;
      var last = inv.users.length-1;
      el.innerHTML = '<div class=\"grid g3\"><div class=\"stat-card\"><div class=\"v v-pink\">'+ inv.users[last].toLocaleString('ru-RU')+'</div><div class=\"l\">пользователей сейчас · рост '+(inv.users[0])+' → '+(inv.users[last])+'</div></div><div class=\"stat-card\"><div class=\"v v-tiffany\">'+ inv.points[last]+'k</div><div class=\"l\">баллов сети · '+(inv.gmv[last])+'k GMV</div></div><div class=\"stat-card\"><div class=\"v v-gold\">'+ inv.categories[0].share+'% '+inv.categories[0].name+'</div><div class=\"l\">топ-категория · '+ inv.categories.map(function(c){return c.name+' '+c.share+'%';}).join(' · ')+'</div></div></div>';
    });
    // repPoints
    var repMounts = qsa('[data-demo=\"rep-points\"]');
    repMounts.forEach(function(el){
      var list = D.repPoints||[];
      el.innerHTML = '<div class=\"grid g2\">'+ list.map(function(r){
        var statusColor = r.status==='active'?'var(--lv-tiffany)':(r.status==='waiting'?'var(--lv-gold)':'var(--lv-dim)');
        return '<div class=\"card\" style=\"padding:14px;display:flex;gap:12px;align-items:center\"><div style=\"width:10px;height:10px;border-radius:50%;background:'+statusColor+'\"></div><div style=\"flex:1;min-width:0\"><div style=\"font-size:13px;font-weight:800\">'+r.name+' · '+r.district+'</div><div style=\"font-size:11px;color:var(--lv-dim)\">'+r.stores+' точек · '+r.city+'</div></div><span class=\"calc-badge\">'+r.status+'</span></div>';
      }).join('')+'</div>';
    });
    // finance rates
    var finMounts = qsa('[data-demo=\"finance\"]');
    finMounts.forEach(function(el){
      var f = D.finance;
      if (!f) return;
      el.innerHTML = '<div class=\"split-legend\" style=\"margin:0\"><span><i style=\"background:var(--lv-pink)\"></i><b>'+Math.round(f.commissionRate*100)+'%</b> нагрузка — покрывает:</span><span><i style=\"background:var(--lv-tiffany)\"></i>комплайнс</span><span><i style=\"background:var(--lv-ink)\"></i>банк-эквайринг</span><span><i style=\"background:var(--lv-gold)\"></i>ИТ-инфраструктура</span><span><i style=\"background:var(--lv-pink)\"></i>маркетинг сети</span><span><i style=\"background:var(--lv-dim)\"></i>отчётность</span></div>';
    });
  }

  /* ---------- Формы-лиды (mailto, без ПДн) — улучшенные ---------- */
  var EMAIL = 'hello@lovii.ru';
  var forms = qsa('form[data-lead]');
  for (var f = 0; f < forms.length; f++) initLeadForm(forms[f]);

  function initLeadForm(form) {
    var cfgEl = form.querySelector('script[type="application/json"]');
    var cfg = {}; try { cfg = JSON.parse(cfgEl ? cfgEl.textContent : '{}'); } catch (e) { cfg = {}; }
    var role = cfg.role || 'Партнёр';
    var consent = form.querySelector('input[name="consent"]');
    var consentBox = form.querySelector('.consent');
    var consentErr = form.querySelector('.form-err');
    var fields = qsa('[data-fname]', form);
    var draftKey = 'lovii_draft_'+role;

    try {
      var draft = JSON.parse(localStorage.getItem(draftKey)||'{}');
      fields.forEach(function(el){
        var k = el.getAttribute('data-fname');
        if (draft[k]) el.value = draft[k];
      });
    } catch(e){}

    function composed() {
      var lines = ['Заявка на lovii.ru · Роль: ' + role, ''];
      fields.forEach(function (el) {
        var v = el.value.trim();
        if (v) lines.push(el.getAttribute('data-label') + ': ' + v);
      });
      var utm = window.__LOVII_UTM||{};
      var utmKeys = Object.keys(utm);
      if (utmKeys.length) {
        lines.push('');
        lines.push('UTM:');
        utmKeys.forEach(function(k){ lines.push(k+': '+utm[k]); });
      }
      lines.push(''); lines.push('Страница: '+location.href);
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
        try {
          var d = {}; fields.forEach(function(f){ d[f.getAttribute('data-fname')] = f.value; });
          localStorage.setItem(draftKey, JSON.stringify(d));
        } catch(e){}
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
      if (!ok) { track('lead_validation_fail', { role: role }); return; }
      var url = mailtoUrl();
      track('lead_submit', { role: role, has_utm: !!Object.keys(window.__LOVII_UTM||{}).length });
      try { localStorage.removeItem(draftKey); } catch(e){}
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
        ' — команда LOVII ответит в течение рабочего дня и подключит вас в роли «' + role + '».</p>' +
        '<pre class="sent-pre"></pre>' +
        '<div class="sent-actions">' +
        '<a class="btn btn-primary" data-analytics="lead_open_mail" href="' + url.replace(/"/g, '&quot;') + '"><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-mail"></use></svg>Открыть почтовый клиент</a>' +
        '<button type="button" class="btn btn-outline" data-copy><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-copy"></use></svg>Скопировать текст</button>' +
        '<a class="btn btn-soft" data-analytics="lead_tg" href="https://t.me/loviiru" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="' + spriteBase() + 'i-send"></use></svg>Написать в Telegram</a>' +
        '<button type="button" class="btn btn-soft" data-again>Заполнить ещё раз</button>' +
        '</div>' +
        '<p class="form-safe" style="margin-top:14px"><svg class="ico" width="18" height="18" aria-hidden="true"><use href="' + spriteBase() + 'i-shield"></use></svg><span>Не открылся клиент? Напишите нам напрямую в Telegram <b>@loviiru</b> — укажите роль «'+role+'» и ваш контакт, мы подхватим заявку.</span></p>';
      sent.querySelector('.sent-pre').textContent = composed();
      form.style.display = 'none';
      panel.appendChild(sent);
      sent.querySelector('[data-copy]').addEventListener('click', function () {
        var txt = sent.querySelector('.sent-pre').textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () { showToast('Текст заявки скопирован'); track('lead_copy'); },
            function () { showToast('Не удалось скопировать — выделите текст вручную'); });
        } else { showToast('Не удалось скопировать — выделите текст вручную'); }
      });
      sent.querySelector('[data-again]').addEventListener('click', function () {
        sent.remove(); form.style.display = ''; form.reset();
        fields.forEach(function (el) { var ff = el.closest('.f-field'); if (ff) ff.classList.remove('error'); });
        var first = form.querySelector('input, textarea'); if (first) first.focus();
        track('lead_again', { role: role });
      });
    }
  }
})();
