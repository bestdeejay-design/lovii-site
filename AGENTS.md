# lovii-site — СТЕНД (staging)

Предпросмотр нового lovii.ru: https://bestdeejay-design.github.io/lovii-site/

## ЖЕЛЕЗНОЕ ПРАВИЛО: stage / prod

- Этот репо — **СТЕНД**. Правки, коммиты и пуши сюда — свободно.
- Прод — отдельный репо `bestdeejay-design/lovii` (ветка `main`, домен lovii.ru).
- **ПРЯМЫЕ пуши в прод ЗАПРЕЩЕНЫ** — руками, скриптами, агентами. Без исключений.
- Публикация на прод — **только** по явной команде владельца «публикуем на прод»:
  Actions этого репо → `publish-prod` → Run workflow → confirm=`PUBLISH`.
  Workflow сам тегирует текущий прод (`prod-*`) и копирует контент.
- Архив истории прода: ветки `archive/*` и теги `prod-*` в репо `lovii`. Не удалять.
- Для публикации нужен секрет `LOVII_PROD_SYNC_TOKEN` (PAT classic, scope `repo`)
  в Settings → Secrets → Actions этого репо. Создаёт владелец один раз.

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
