---
name: add-drill
description: Adds a Hold'em trainer drill module, registry row, fixture, guide article, and level quota. Use when creating or extending a drill, generator, or grade function.
---

# Новый тренажёр

1. Файл модуля в `packages/engine/drills`. Экспорт: `id`, название, уровни, `generate`, `grade`, `articleId`.
2. Одна строка в `packages/engine/registry.ts`. Оболочку сессии не менять под конкретный `id`.
3. Фикстура рядом с модулем. Числа сверить скиллом `check-formulas`: бэкдор не 9 аутов, пот-оддсы 33% не подменять MDF 50%.
4. Статья в `packages/domain`: `what`, `example`, `caveat`, и `drillId`, если уровень уже есть.
5. Квоту уровня взять из `packages/domain`, не зашивать 60, 80 или 100 в экран.
6. Не добавлять колонку в `Answer`. Вопрос и ответ остаются JSON.
