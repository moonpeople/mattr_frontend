# MATTR Portal: выкладка в production

## 1. Подготовка

1. Клонировать репозиторий.
2. Создать `.env.production` на базе `.env.production.example`.
3. Заполнить все `NEXT_PUBLIC_*`, URL целевых сервисов и `PORTAL_IMAGE`.

## 2. Запуск в Docker (prebuilt image)

```bash
docker compose -f docker-compose.production.yml pull
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
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

## 4. Откат

1. Указать предыдущий тег образа в `PORTAL_IMAGE`.
2. Выполнить `docker compose -f docker-compose.production.yml up -d`.

## 5. Важно

- Прод-сборка идет через `next build --webpack` (без Turbopack).
- Проверка TypeScript на build отключена в `next.config.mjs` (`ignoreBuildErrors: true`) из-за легаси-кода dashboard.
- Рекомендуется отдельный reverse proxy (Nginx/Traefik) перед порталом и TLS на внешнем уровне.

## 6. CI (сборка и push в registry)

Используется workflow: `.github/workflows/portal-image.yml`.

Минимально:
- `Repository variable`: `PORTAL_REGISTRY_IMAGE`  
  пример: `registry.mattr.ru/mattr/mattr-portal`
- `Repository variable`: `PORTAL_REGISTRY_USERNAME`  
  для `mattr-registry`: `registry`
- `Repository secret`: `PORTAL_REGISTRY_PASSWORD`

Опционально:
- `Repository variable`: `PORTAL_REGISTRY_HOST`  
  если пусто, host берется из `PORTAL_REGISTRY_IMAGE`

Опционально для build-time env:
- `Repository secret`: `PORTAL_DOTENV_PRODUCTION` (полный текст `.env.production`)
