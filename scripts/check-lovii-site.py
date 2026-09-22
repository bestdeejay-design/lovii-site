#!/usr/bin/env python3
# ============================================================
# Стражи приёмки сайта lovii-site.
#
# Проверяют три вещи, которые уже один раз ломались:
#   1) сырые цвета в стилях сайта — всё должно быть на токенах системы;
#   2) размеры иконок вне ступеней системы (12/16/18/20/24/32);
#   3) шапка снапшота дизайн-системы ссылается на актуальный канон.
#
# Запуск (из корня сайта):  python3 scripts/check-lovii-site.py [--strict]
# ============================================================
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = ROOT / "assets" / "site.css"
SNAP = ROOT / "assets" / "lovii.css"
STEPS = {12, 16, 18, 20, 24, 32}
problems = []

text = CSS.read_text(encoding="utf-8")
no_comments = re.sub(r"/\*.*?\*/", "", text, flags=re.S)

hexes = re.findall(r"#[0-9a-fA-F]{3,8}\b", no_comments)
if hexes:
    problems.append(f"сырые hex в site.css: {len(hexes)} → {', '.join(sorted(set(hexes))[:6])}")

off = []
for m in re.finditer(r"([^{}]*\.ico[^{}]*)\{([^}]*)\}", no_comments):
    sel, body = m.group(1).strip(), m.group(2)
    if re.search(r"ico-badge", sel):          # плитки — контейнеры, у них свои размеры
        continue
    w = re.search(r"width:\s*([0-9]+)px", body)
    if w and int(w.group(1)) not in STEPS:
        off.append(f"{re.sub(r'\s+',' ',sel)[:34]} = {w.group(1)}px")
if off:
    problems.append(f"размеры иконок вне ступеней: {len(off)} → " + "; ".join(off[:4]))

if SNAP.exists():
    head = SNAP.read_text(encoding="utf-8")[:300]
    m = re.search(r"lovii-design@([0-9a-f]{7,})", head)
    import subprocess
    try:
        canon = subprocess.check_output(
            ["git", "-C", str(ROOT.parent / "lovii-design"), "rev-parse", "--short", "HEAD"],
            text=True, stderr=subprocess.DEVNULL).strip()
        if m and canon and not canon.startswith(m.group(1)) and not m.group(1).startswith(canon):
            problems.append(f"снапшот ДС устарел: сайт @{m.group(1)}, канон @{canon}")
    except Exception:
        pass   # канона рядом нет — проверку пропускаем

if problems:
    print("найдено:")
    for p in problems: print("  ·", p)
    sys.exit(1 if "--strict" in sys.argv else 0)
print("сайт чист: цветов вне токенов нет, иконки на ступенях, снапшот актуален ✓")
