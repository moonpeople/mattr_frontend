# MATTR Portal (единый вход) — черновик

Лёгкий Next.js-шелл, который делает только три вещи:
1) логин через `mattr_auth` (JWT в HttpOnly cookie на базовом домене);
2) читает из `mattr_platform` организации и проекты;
3) редиректит в нужный фронт по типу проекта (`iot`, `base`) на пути `/iot/:projectRef` или `/studio/:projectRef`.

## Быстрый старт (pnpm, локально)
```bash
cd apps/portal
pnpm install
NEXT_PUBLIC_PLATFORM_API_URL=http://localhost:4000 \   # mattr_platform root; клиент сам добавит /api/platform
NEXT_PUBLIC_AUTH_URL=http://localhost:4011 \           # mattr_auth (страница логина)
IOT_STUDIO_URL=http://localhost:8084 \                # iot (прокси для /iot/*)
STUDIO_URL=http://localhost:8082 \                    # studio (прокси для /studio/*)
BUILDER_URL=http://localhost:8083 \                   # builder (прокси для /apps/*)
pnpm dev
```
Если переменная не задана, портал покажет sample-данные (ничего не ломает).

## Ожидаемые эндпоинты
- `GET /api/platform/organizations` → [{ id, name, slug }]
- `GET /api/platform/organizations/:slug/projects` → [{ id, ref, name, organization_slug, project_type ∈ {base, iot} }]
- Портал сам мапит `project_type=iot` → `/iot/:projectRef`, `project_type=base` → `/studio/:projectRef`.

## Маршрутизация (cloud)
- `/portal/*` → portal
- `/studio/*` → studio (через прокси)
- `/iot/*` → iot (через прокси)
- `/apps/*` → builder (через прокси)
Пример nginx/traefik см. в `../../X_AI_DOCS/PORTAL_PROXY.md`.

## Безопасность и совместимость
- Включаем через фичефлаг `ENABLE_PORTAL_MATTR` (или старый `ENABLE_PORTAL_FLOW` для совместимости); старые прямые URL фронтов оставить рабочими.
- Для разных доменов фронтов: добавить API `POST /app-tokens` (projectId) в `mattr_platform`, возвращать короткий signed JWT; целевой фронт обменивает его на cookie.
- JWT хранить в HttpOnly cookie на домене верхнего уровня (см. proxy-конфиг).

## Новые страницы в портале
- `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` — тонкие формы, отправляют запросы в `mattr_auth` (REST) и перенаправляют в портал.
- `/organizations` и `/organizations/:slug` — список орг и проектов из `mattr_platform`, кнопки перехода в нужный фронт по `project_type`.
- Если нужно запустить без прокси, можно использовать каталог `pages/` с реэкспортами страниц из `mattr_studio/apps/studio/pages/*`. Требуется: включённый `experimental.externalDir` (уже в `next.config.mjs`), зависимости mattr_studio в node_modules (общий `pnpm i` на корне), алиасы в `tsconfig.json` (`@/*`, `@ui/*`, `mattr_studio_pages/*` — уже настроены).
