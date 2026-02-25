# MATTR Portal: выкладка в production

## 1. Подготовка

1. Клонировать репозиторий.
2. Создать `.env.production` на базе `.env.production.example`.
3. Заполнить все `NEXT_PUBLIC_*` и URL целевых сервисов.

## 2. Сборка и запуск в Docker

```bash
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

Если хотите проверить compose без создания `.env.production`, можно использовать:

```bash
PORTAL_ENV_FILE=.env.production.example docker compose -f docker-compose.production.yml config
```

Проверка:

```bash
docker compose -f docker-compose.production.yml ps
curl -I http://127.0.0.1:3000
```

## 3. Обновление при новом релизе

```bash
git pull
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

## 4. Откат

1. Переключиться на предыдущий commit/tag.
2. Повторить `build` + `up -d`.

## 5. Важно

- Прод-сборка идет через `next build --webpack` (без Turbopack).
- Проверка TypeScript на build отключена в `next.config.mjs` (`ignoreBuildErrors: true`) из-за легаси-кода dashboard.
- Рекомендуется отдельный reverse proxy (Nginx/Traefik) перед порталом и TLS на внешнем уровне.
