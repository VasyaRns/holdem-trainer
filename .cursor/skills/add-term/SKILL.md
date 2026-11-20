---
name: add-term
description: Adds a glossary term and optional guide article for the Hold'em trainer. Use when adding a poker term, glossary row, or справочник article.
---

# Новый термин

1. Запись в данных `packages/domain`, не в JSX.
2. Поля термина: `id`, `title`, `text`, `group`. `text` — одно предложение.
3. Если нужна статья, отдельные поля: `what`, `example`, `caveat`. Термин ссылается через `articleId`.
4. `group` один из уже существующих: руки, торговля, стол, улицы, прогресс.
5. Якорь статьи равен `id`. Фильтр терминов ищет по `title` и `text`.
6. Кнопку «Тренировать» ставить только вместе с `drillId`. Иначе текст «Тренажёра пока нет».
