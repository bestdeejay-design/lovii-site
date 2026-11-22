# lovii-site — СТЕНД (staging)

Предпросмотр нового lovii.ru: https://bestdeejay-design.github.io/lovii-site/

## ЖЕЛЕЗНОЕ ПРАВИЛО: stage / prod

- Этот репо — **СТЕНД**. Правки, коммиты и пуши сюда — свободно.
- Прод — отдельный репо `bestdeejay-design/lovii` (ветка `main`, домен lovii.ru).
- **ПРЯМЫЕ пуши в прод ЗАПРЕЩЕНЫ** — руками, скриптами, агентами. Без исключений.
- Публикация на прод — **только** по явной команде владельца «публикуем на прод»:
  `gh workflow run sync-from-stage --repo bestdeejay-design/lovii -f confirm=PUBLISH`.
  Workflow живёт в прод-репо, читает этот репо и пишет своим `GITHUB_TOKEN` —
  PAT и секреты не нужны (прежний `publish-prod` с PAT удалён: отзыв токена
  убивал публикацию).
  Откат: `... -f confirm=ROLLBACK -f tag=prod-YYYYMMDD-HHMMSS`.
- Архив истории прода: ветки `archive/*` и теги `prod-*` в репо `lovii`. Не удалять.

## Гейт после правок (перед каждым коммитом)

```bash
python3 scripts/check-lovii-site.py --strict   # exit 0
python3 scripts/extract_texts.py               # реген TEXTS-INVENTORY.md
```

## Конвенции контента (кратко)

- Тон «ты», русские conventional-коммиты (`copy(...)`, `fix(...)`).
- Демо — `https://lovii.mobiap.com/`; staging-ссылки запрещены.
- Цвета только токенами (`var(--lv-*)`), hex в `site.css` запрещён.
- JSON-LD FAQ = числу `<details>` на странице.
- Футерный «Фаундер» — на всех страницах; в баннерах фаундера нет.

## Паттерн: общий код страниц — в assets/, не в HTML

- Счётчики, пиксели, виджеты, общие скрипты живут в отдельных файлах
  `assets/` (пример: `assets/counters.js` — все счётчики в одном месте).
- В HTML — только одна строка подключения (`<script src defer>`) + `noscript`
  при необходимости. Инлайн-скрипты длиннее 3 строк запрещены.
- Причина: переиспользование без копипасты, один дом для правок, чистое CSP-будущее.
