# Семейное Древо (Family Tree)

Веб-приложение для построения и совместного ведения генеалогических деревьев.

## Что умеет проект

- Создание нескольких семейных деревьев и управление участниками.
- Добавление персон, связей и событий жизни.
- Визуализация дерева (SVG-граф) и дополнительные представления (таймлайн, fan chart).
- Загрузка медиафайлов и комментариев.
- Импорт/экспорт GEDCOM и экспорт в JSON.
- Приглашения в дерево по токену и ролевая модель доступа.
- Журнал аудита изменений.

## Технологии

- Backend: Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA.
- Frontend: React 19 + Vite, React Router.
- Infra: PostgreSQL, Redis, MinIO, Nginx.
- Оркестрация: Docker Compose.

## Структура репозитория

- `backend/` — REST API и бизнес-логика.
- `frontend/` — SPA-клиент.
- `nginx/` — reverse proxy (маршрутизация `/`, `/api/`, `/media/`).
- `scripts/` — скрипты генерации тестовых данных.
- `docs/` — пользовательская и эксплуатационная документация.
- `docs_2025/` — дополнительные материалы.
- `docker-compose.yml` — запуск всего стенда.

Подробное описание каталогов: `docs/структура_проекта.md`.

## Быстрый старт (рекомендуется)

Сборка и запуск выполняются через Docker.

### 1. Запуск всех сервисов

```bash
docker compose up --build -d
```

### 2. Проверка доступности

- Приложение: http://localhost
- API ping: http://localhost/api/ping
- MinIO Console: http://localhost:9001

### 3. Остановка

```bash
docker compose down
```

Чтобы удалить тома данных (PostgreSQL/MinIO):

```bash
docker compose down -v
```

## Сервисы и порты

- Nginx: `80` (входная точка).
- Backend: `8080` (внутренний API-сервис, проксируется через Nginx).
- PostgreSQL: `5434` (наружу) -> `5432` (в контейнере).
- Redis: `6379`.
- MinIO API: `9000`.
- MinIO Console: `9001`.

## Переменные и окружение

Ключевые настройки заданы в `docker-compose.yml` и `backend/src/main/resources/application.yml`.

- БД: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- JWT: `JWT_SECRET`.
- MinIO: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.
- Почта: `MAIL_USERNAME`, `MAIL_PASSWORD`.

## Полезные команды

```bash
# Логи всех контейнеров
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Пересобрать и перезапустить
docker compose up --build -d
```

## Диагностика

- Backend не стартует: проверьте состояние `postgres` и `redis`.
- Не открываются медиа: проверьте `minio` и маршрут `/media/` в `nginx/nginx.conf`.
- Ошибки авторизации: проверьте `JWT_SECRET` и валидность токена.

## Текущее состояние тестов

Тестовая инфраструктура присутствует, но автотестов пока минимум/нет.

## Лицензия

Лицензия в репозитории не указана. При необходимости добавьте файл `LICENSE`.
