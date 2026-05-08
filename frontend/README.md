# Frontend модуля Family Tree

Frontend реализован на React + Vite и работает как SPA-клиент для backend API.

## Основные папки

- `src/pages` — страницы приложения.
- `src/components` — переиспользуемые UI/feature-компоненты.
- `src/api` — клиентские модули для работы с backend.
- `src/context` — глобальные контексты состояния.
- `src/utils` — утилиты и вычислительные функции.

## Запуск

Основной рекомендованный способ запуска проекта — через Docker Compose из корня репозитория:

```bash
docker compose up --build -d
```

Локальные команды для frontend:

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Дополнительно

Полная документация по проекту находится в корневом `README.md`.
