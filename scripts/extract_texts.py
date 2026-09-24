#!/usr/bin/env python3
"""Извлечение пользовательских текстов lovii-site в TEXTS-INVENTORY.md для вычитки."""
import json, re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = [
    ('Главная', 'index.html'),
    ('Покупателям', 'clients/index.html'),
    ('Бизнесу', 'business/index.html'),
    ('Партнёрам', 'partners/index.html'),
    ('Амбассадорам', 'ambassadors/index.html'),
    ('Инвесторам', 'investors/index.html'),
    ('Дорожная карта', 'roadmap/index.html'),
    ('Страница 404', '404.html'),
    ('Журнал', 'journal/index.html'),
    ('Журнал — комиссии', 'journal/aggregator-fees/index.html'),
    ('Журнал — касса', 'journal/fiscal-54fz/index.html'),
    ('Журнал — лояльность', 'journal/cashback-vs-discount/index.html'),
    ('Журнал — налоги', 'journal/selfemployed-vs-ip/index.html'),
    ('Журнал — запуск', 'journal/qr-onboarding/index.html'),
    ('Журнал — район', 'journal/district-showcase/index.html'),
    ('Журнал — тарифы', 'journal/choose-tariff/index.html'),
    ('Журнал — представитель', 'journal/rep-area/index.html'),
    ('Журнал — уход с агрегатора', 'journal/left-aggregator/index.html'),
    ('Журнал — месяц на витрине', 'journal/vitrina-result/index.html'),
    ('Журнал — инвестиции', 'journal/local-investment/index.html'),
]
SKIP = {'script', 'style', 'svg', 'head', 'title', 'noscript', 'template'}
STRUCTURAL = {'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button',
              'figcaption', 'summary', 'blockquote', 'td', 'th', 'label', 'option'}
FALLBACK = {'div', 'span', 'b', 'strong', 'small', 'em', 'i', 'code'}
TRACK = STRUCTURAL | FALLBACK

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.stack = []          # [tag, cls, href, buf]
        self.blocks = []
        self.metas = []
        self.in_title = False
        self.title = ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            if self.skip_depth:
                return
            name = a.get('name') or a.get('property') or ''
            content = a.get('content', '')
            if content and name and not name.startswith('viewport'):
                self.metas.append((name, content))
            return
        if tag in SKIP:
            self.skip_depth += 1
            if tag == 'title':
                self.in_title = True
            return
        if self.skip_depth:
            return
        if tag == 'img':
            alt = (a.get('alt') or '').strip()
            if alt:
                self.blocks.append(('alt', a.get('class', ''), '', alt))
            return
        if tag in TRACK:
            has_s = tag in STRUCTURAL
            self.stack.append([tag, a.get('class', ''), a.get('href', ''), [], has_s])
            if tag in STRUCTURAL:
                for fr in self.stack[:-1]:
                    if fr[0] in FALLBACK:
                        fr[4] = True

    def handle_endtag(self, tag):
        if tag in SKIP:
            if tag == 'title':
                self.in_title = False
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if self.skip_depth or tag not in TRACK:
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                frame = self.stack.pop(i)          # всплытие до совпадения
                for j in range(i, len(self.stack)):
                    pass                            # буферы предков уже содержат текст
                text = ' '.join(''.join(frame[3]).split())
                emit = text and (frame[0] in STRUCTURAL or not frame[4])
                if emit:
                    self.blocks.append((frame[0], frame[1], frame[2], text))
                break

    def handle_data(self, d):
        if self.in_title:
            self.title += d
            return
        if self.skip_depth or not d.strip():
            return
        for fr in self.stack:                       # текст копится во всех открытых рамках
            fr[3].append(d)

def js_strings(path: Path):
    out = []
    for i, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        for m in re.finditer(r"['\"]([^'\"]*[а-яёА-ЯЁ][^'\"]*)['\"]", line):
            out.append((i, m.group(1)))
    return out

def main():
    lines = ['# TEXTS-INVENTORY — вычитка текстов lovii-site', '',
             'Каждый блок: `№` — **тег** `[class]` `(href)` → текст.',
             'Правки присылай форматом: `страница, № блок → новый текст`.', '']
    for title, rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        ext = Extractor()
        ext.feed(p.read_text(encoding='utf-8'))
        ext.close()
        lines.append(f'## 📄 {title} ({rel}) — <title>: {ext.title.strip()}')
        lines.append('')
        for name, content in ext.metas:
            lines.append(f'- **[meta:{name}]** {content}')
        if ext.metas:
            lines.append('')
        for n, (tag, cls, href, text) in enumerate(ext.blocks, 1):
            parts = f'**{n}. [{tag}]**'
            if cls:
                parts += f' `{cls}`'
            if href:
                parts += f' ({href})'
            lines.append(f'{parts} {text}')
        lines.append('')
    for rel in ['assets/site.js', 'assets/lovii-demo-data.js']:
        p = ROOT / rel
        if not p.exists():
            continue
        lines.append(f'## 📄 Строки JS ({rel})')
        lines.append('')
        for i, s in js_strings(p):
            lines.append(f'- **строка {i}**: {s}')
        lines.append('')
    man = ROOT / 'manifest.webmanifest'
    if man.exists():
        lines.append('## 📄 manifest.webmanifest')
        lines.append('')
        try:
            data = json.loads(man.read_text(encoding='utf-8'))
            for k in ('name', 'short_name', 'description', 'start_url', 'scope'):
                if k in data:
                    lines.append(f'- **{k}**: {data[k]}')
        except Exception as e:
            lines.append(f'- (ошибка парсинга: {e})')
        lines.append('')
    out = ROOT / 'TEXTS-INVENTORY.md'
    out.write_text('\n'.join(lines), encoding='utf-8')
    print(f'written {out} ({out.stat().st_size} bytes, {len(lines)} lines)')

if __name__ == '__main__':
    main()
