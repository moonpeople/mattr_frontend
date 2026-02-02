# MATTR Frontend

## Где вести разработку
- Портал: `mattr/apps/portal`
- IoT Studio: `mattr/apps/iot`

## Запуск (pnpm)
```bash
cd mattr
pnpm install

# портал
pnpm dev

# iot
pnpm dev:iot
```

## Как запускать

### Платформенный режим (iot)
```bash
cd mattr
pnpm install
pnpm --filter ./apps/iot dev:platform
```

### Standalone режим (iot)
```bash
cd mattr
pnpm install
pnpm --filter ./apps/iot dev:standalone
```

### Все вместе (portal + iot в платформенном режиме)
```bash
cd mattr
pnpm install
pnpm dev:all
```

## Репозитории
- `mattr` → https://github.com/moonpeople/mattr_frontend.git
- `iot_studio` (upstream) → https://github.com/moonpeople/iot_studio.git

## Синхронизация iot_studio ↔ mattr

### Из mattr в upstream (для push в moonpeople/iot_studio)
```bash
./scripts/sync-iot-to-upstream.sh
git -C ../iot_studio status
git -C ../iot_studio add .
git -C ../iot_studio commit -m "Sync from mattr"
git -C ../iot_studio push
```

### Из upstream в mattr (если надо подтянуть изменения)
```bash
git -C ../iot_studio pull
./scripts/sync-iot-from-upstream.sh
```

## Примечания
- Разработка IoT ведётся в `mattr/apps/iot`, а sync-скрипты приводят пути к формату upstream.
