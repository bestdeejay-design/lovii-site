# LOVII — lovii-site

Превью **нового lovii.ru** перед релизом на главный домен («День X»).
Прод-адрес превью: https://bestdeejay-design.github.io/lovii-site/

## Что это

Чистый статический сайт (HTML + один файл ДС), без сборки и фреймворков:
7 страниц — хаб + 5 аудиторий + 404 — с честными URL, которые на Дне X
переезжают на lovii.ru один в один:

```
/                 → lovii.ru/
/clients/         → lovii.ru/clients/        (клиентам — URL только на английском)
/business/        → lovii.ru/business/
/partners/        → lovii.ru/partners/
/ambassadors/     → lovii.ru/ambassadors/
/investors/       → lovii.ru/investors/
/404.html
```

Транслит в URL запрещён (решение владельца): аудитории называются
по-английски — `clients`, `business`, `partners`, `ambassadors`, `investors`.
Страж: `scripts/check_lovii_site_paths.py` (падает, если транслит вернётся).

## Пути — только относительные (урок релиза)

Сайт должен работать ЛЮБОМ базовом пути: GitHub Pages превью —
`/lovii-site/`, Домен X — корень `/`. Поэтому:

- HTML генерируется с относительными путями от глубины страницы:
  корень — `./assets/...`, секции — `../assets/...`;
- корневые абсолютные пути (`/assets/...`) запрещены — на подпутине
  GitHub Pages они ломаются (404 на стили/лого/скрипты);
- `404.html` отдаётся на ЛЮБОЙ глубине, поэтому в нём динамический
  `<base>`: скрипт первым элементом `<head>` определяет базу сайта
  (`/lovii-site/` на превью, `/` на домене) — стили и ссылки работают
  даже по адресу вида `/lovii-site/что-угодно/`;
- приёмка: `scripts/check_lovii_site_paths.py` (запрет абсолютных путей,
  резолв каждой ссылки в файл репо) + `scripts/smoke_lovii_site.py`
  (консоль, темы, мобильный 390px, форма, скриншоты).

## Дизайн-система — «меняю в одном месте»

- `assets/lovii.css` — снапшот LOVII UI v1.0 (канон `lovii-design@ba685fb`, ДС v1.10.0).
  **Править снапшот запрещено** (AGENTS lovii-design, пр.14). Правки компонента
  делаются в lovii-design → `build-lovii-css.py` → `sync-lovii-css.py`.
- `assets/site.css` — только лендинг-слой этого сайта (сетка, секции, FAQ, футер).
  Цвета — исключительно `var(--lv-*)` + `color-mix()` от канонических токенов.
- `assets/icons.svg` — локальный спрайт иконок (контурная lucide-система, как в ДС).

## Контент

Тексты и цифры — дословный перенос утверждённого контента lovii-legacy
(6 экранов) с коррекциями по канонам lovii-docs (PARAMS, оферты, контакты).
Источники: `lovii/docs/content-dossier/`, канон — `lovii-docs/canon/`.

## Статус превью (сознательно, до Дня X)

- `robots.txt` — `Disallow: /` (поиск не видит превью);
- `<meta name="robots" content="noindex, follow">` на всех страницах;
- canonical/OG/sitemap уже указывают на финальные адреса `lovii.ru`.

## Чек-лист Дня X

1. DNS lovii.ru → GitHub Pages (или перенос содержимого в репо `lovii`).
2. `robots.txt`: убрать `Disallow`, оставить `Sitemap: https://lovii.ru/sitemap.xml`.
3. Снять `noindex` (генерация: `scripts/build_lovii_site.py`, флаг `--prod`).
4. Проверить, что динамический `<base>` в 404.html перешёл на `/`
   (детект `/lovii-site/` просто не сработает — правок не требует).
5. Подключить `assets/lovii.css` у существующего lovii.ru остаётся снапшотом —
   синхронизация через lovii-design (`sync-lovii-css.py`, TARGETS уже включает lovii-site).
6. Проверить OG-карточку и 404, перелогинить Search Console.
