/* Счётчики аналитики — единый дом для всех страниц сайта.
   Подключён как <script src="assets/counters.js" defer> в <head> каждой страницы.
   Новые счётчики добавлять сюда, а не в HTML.
   ПАТТЕРН ДЛЯ АГЕНТОВ: любой общий код страниц (счётчики, пиксели, виджеты)
   живёт в отдельном файле assets/, в HTML — только одна строка подключения
   + noscript-фолбэк при необходимости. Инлайн-скрипты длиннее 3 строк запрещены:
   их нельзя переиспользовать, они расползаются копипастой и ломают CSP-будущее. */
(function () {
  'use strict';

  /* ---------- Yandex.Metrika 112999617 ---------- */
  (function (m, e, t, r, i) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
    var k = e.createElement(t), a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=112999617', 'ym');
  window.ym(112999617, 'init', {
    ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer',
    accurateTrackBounce: true, trackLinks: true
  });

  /* ---------- Google Analytics 4: G-DVNNZ3Y7XH ---------- */
  (function (w, d, src) {
    for (var j = 0; j < d.scripts.length; j++) { if (d.scripts[j].src === src) return; }
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    var k = d.createElement('script'), a = d.getElementsByTagName('script')[0];
    k.async = 1; k.src = src; a.parentNode.insertBefore(k, a);
    w.gtag('js', new Date());
    w.gtag('config', 'G-DVNNZ3Y7XH');
  })(window, document, 'https://www.googletagmanager.com/gtag/js?id=G-DVNNZ3Y7XH');
})();
