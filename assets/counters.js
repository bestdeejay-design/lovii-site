/* Счётчики аналитики — единый дом для всех страниц сайта.
   Подключён как <script src="assets/counters.js" defer> в <head> каждой страницы.
   Новые счётчики добавлять сюда, а не в HTML. */
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
})();
