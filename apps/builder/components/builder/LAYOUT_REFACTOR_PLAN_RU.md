# План рефакторинга layout (Retool-like)

Дата фиксации: 2026-02-16

## Цель

Привести структуру Builder к модели:
- App container (app-level): `header?`, `sidebar?`
- Page container (page-level): `main` (обязательно), `splitPane?`, `drawers[]`, `modals[]`
- `Page` хранит `meta + layout`, без legacy-веток.

## План работ

1. Ввести новую модель данных в `types`:
   - `AppLayout: header?, sidebar?`
   - `PageLayout: main (required), splitPane?, drawers[], modals[]`
   - `Page` хранит `meta + layout`, а не `pageComponent/pageGlobals/widgets` в старом виде.

2. Удалить старые поля и ветки:
   - убрать `pageComponent`, `pageGlobals`, `globalWidgets`-flow.
   - заменить на единый `layout` state в `BuilderShell`.

3. Перестроить add/delete/update API внутри builder:
   - операции по layout slots (`app.header`, `page.main`, `page.drawers[i]` и т.д.).
   - правила:
     - Header/Sidebar только app-level, max 1.
     - SplitPane только page-level, max 1.
     - Drawer/Modal page-level, many.
     - Main всегда есть.

4. Пересобрать `BuilderSidebarPanelTree` под новую иерархию:
   - `Page` (сущность)
   - внутри: `Main`, `SplitPane?`, `Drawers`, `Modals`
   - отдельно: `App Header/Sidebar`

5. Пересобрать `BuilderCanvas` под новый render order:
   - app-level frames
   - page-level frames
   - main content

6. Пересобрать selection:
   - единый `selectedNode` (`app | page | frame | main | widget`)
   - убрать split-состояния выбора.

7. Пересобрать inspector routing:
   - Page Inspector
   - Main Inspector
   - Frame Inspector
   - Widget Inspector

8. Почистить QuickAdd/DnD:
   - в меню и drop-зонах показывать только валидные цели по `scope/cardinality`.

9. Минимальные тесты/проверки:
   - правила `scope/cardinality`
   - корректный routing инспектора
   - add/move/delete для frames

## Статус на сейчас

- `[x]` Базовые layout-типы и хелперы (`AppLayout/PageLayout`, frame constraints) введены.
- `[x]` Базовая иерархия дерева и единый `selectedNode` внедрены.
- `[x]` Вынесен модуль autosave из `BuilderShell`.
- `[x]` `appLayout` убран из `BuilderPage` (единый источник истины: app-level state).
- `[x]` Page slot API централизован в `utils/layout-slots.ts` (`resolve/apply/update`).
- `[x]` Legacy naming cleanup: завершен перенос `globalWidgets -> appFrameWidgets` в builder-компонентах.
- `[x]` Финальная зачистка legacy flow и стабилизация QuickAdd/DnD по новым slot rules.
  : в каталоге компонентов добавлен явный режим `page-frame` (без редиректа через `app-frame`).
  : добавлена проверка `isWidgetSelectable` для карточек/строк, frame-виджеты блокируются по текущему `cardinality`.
  : в `BuilderCanvas` добавлена жесткая валидация drag payload (`application/x-builder-widget`) + preset/widget match перед drop.
  : в `BuilderShell` добавлена валидация `presetId -> widgetType` для drop/add handlers.
  : в `BuilderShell` обновление выбранного виджета переведено на `selectedNode/scope` helper (без legacy split-веток выбора).
  : в `BuilderSidebar`/`BuilderSidebarPanelTree`/`TreeRow` legacy-нейминг `global` заменен на `frame` (`onSelectFrameWidget`, `selectedFrameWidgetId`).
  : в `BuilderCanvas` и `BuilderStatePanel` завершен перенос legacy-нейминга `global*` на `frame*`.
  : в `BuilderCanvas`/`BuilderShell` API именован в `appFrame*` (`onDropAppFrameWidget`, `onUpdateAppFrameWidgetLayout`, `onUpdateAppFrameChildLayout`).
- `[x]` Пересобран routing инспектора в отдельный helper (`utils/inspector-routing.ts`) и подключен в `BuilderShell`.
- `[x]` Добавлены и прогнаны минимальные тесты по slot/cardinality (`types.test.ts`, `layout-slots.test.ts`).
  : добавлены тесты routing инспектора (`inspector-routing.test.ts`).
  : добавлены тесты frame add/move/delete и mode-логики (`frame-ops.test.ts`).
  : добавлены smoke/unit тесты QuickAdd/DnD (`quickadd-dnd.test.ts`).
  : для test-окружения добавлен `jsdom` в `apps/builder`.

## Вариант 2: Рефактор BuilderCanvas (controller + view + hooks)

Цель: уменьшить связанность `BuilderCanvas`, не ломая внешний контракт для `BuilderShell`.

1. Зафиксировать контракт `BuilderCanvas`:
   - не менять публичные props/callbacks;
   - сохранить поведение DnD/resize/quick-add/selection/overlays.

2. Вынести чистые утилиты Canvas:
   - `canvas/shared.ts` (константы, parse/pointer/dnd/theme/layout helper-ы);
   - убрать дубли/локальные утилиты из `BuilderCanvas`.

3. Вынести презентационные компоненты:
   - `canvas/components/CanvasCard.tsx`;
   - `canvas/components/EmptyStateAddComponentPopover.tsx`.

4. Вынести состояние и эффекты в hooks:
   - `canvas/hooks/useCanvasDndState.ts`;
   - `canvas/hooks/useCanvasQuickAddState.ts`.

5. Разделить view по зонам:
   - `CanvasMainArea`, `CanvasFrameArea`, `CanvasOverlays`, `CanvasGrid`.

6. Оставить `BuilderCanvas` как controller:
   - orchestration + wiring callbacks + derived state.

7. Удалить дублирование `renderGrid/renderGlobalGrid`:
   - единый `CanvasGrid` с конфигом режима (main/frame/overlay).

8. Проверка паритета:
   - DnD add/move/resize;
   - quick-add (включая presets);
   - selection routing;
   - hidden/showInEdit overlays;
   - auto-height widgets.

### Статус выполнения варианта 2

- `[x]` Шаг 1: контракт `BuilderCanvas` сохранен (props/callbacks без breaking API).
- `[x]` Шаг 2: вынесены утилиты в `canvas/shared.ts`.
- `[x]` Шаг 3: вынесены `CanvasCard` и `EmptyStateAddComponentPopover`.
- `[x]` Шаг 4: вынесены `useCanvasDndState` и `useCanvasQuickAddState`.
- `[x]` Шаг 5: view разделен и вынесен по секциям (`CanvasViewport`, `CanvasMainArea`, renderer-слой для frame/overlay).
- `[x]` Шаг 6: `BuilderCanvas` упрощен до orchestration-слоя (добавлены hooks `useCanvasFrameSections`, `useCanvasWidgetCatalog`, вынесены `frame/overlay` renderers; grid orchestration сведена к shared `renderCanvasGrid`).
- `[x]` Шаг 7: дублирование `renderGrid/renderGlobalGrid` сведено в единый рендерер `renderCanvasGrid` (shared shell + DnD + drop + preview + background).
- `[x]` Шаг 8: финальная проверка паритета поведения.
  : `BuilderCanvas.tsx` проверен `eslint` (warning `react-hooks/exhaustive-deps` устранен через стабильный ref-wrapper для internal DnD update).
  : прогнаны целевые smoke-тесты: `quickadd-dnd.test.ts`, `frame-ops.test.ts`, `layout-slots.test.ts`, `inspector-routing.test.ts` (все зеленые).

## Вариант 3: Стабилизация autosave в BuilderShell

Цель: убрать постоянные циклы автосохранения и сделать поведение autosave предсказуемым во время разработки.

1. Зафиксировать canonical-подпись для autosave:
   - после успешного `PUT /draft` использовать подпись локально отправленного payload как baseline;
   - не запускать повторный persist только из-за server-side canonicalization.

2. Добавить диагностику mismatch:
   - если сервер вернул структурно отличный schema snapshot, логировать diff один раз на пару сигнатур.

3. Покрыть автосохранение точечными тестами:
   - нет циклического autosave при различии server/client canonical signatures;
   - ручной `saveNow()` работает даже при `enabled: false`.

4. Прогнать точечные проверки и зафиксировать статус.

### Статус выполнения варианта 3

- `[x]` Шаг 1: в `useBuilderDraftAutosave` baseline обновляется на client signature после успешного persist.
- `[x]` Шаг 2: добавлен one-shot debug diff при server/client mismatch.
- `[x]` Шаг 3: добавлен `useBuilderDraftAutosave.test.ts` с кейсами loop-guard и manual save.
- `[x]` Шаг 4: финальный прогон проверок.
  : `eslint` (autosave hook + test) — без ошибок.
  : `vitest --run components/builder/autosave/useBuilderDraftAutosave.test.ts` — 2/2 теста зеленые.

## Вариант 4: Вынесение preview/publish orchestration из BuilderShell

Цель: уменьшить размер `BuilderShell` и убрать дубли logic-flow для preview/publish, сохранив текущее поведение.

1. Вынести orchestration в отдельный hook:
   - open preview snapshot + draft flush + routing;
   - confirm publish + draft flush + payload resolve.

2. Перевести `BuilderShell` на hook wiring:
   - оставить в shell только callbacks `openPreviewRoute` и `publishRuntimePayload`;
   - использовать `canPublish/openPreview/confirmPublish` из hook.

3. Добавить точечные тесты на новый hook:
   - snapshot в `sessionStorage`;
   - fallback при ошибке `flushLatest`;
   - publish с persisted schema.

4. Прогнать проверки.

### Статус выполнения варианта 4

- `[x]` Шаг 1: добавлен `useBuilderPreviewPublishActions.ts`.
- `[x]` Шаг 2: `BuilderShell` переведен на hook (`handleOpenPreview`, `handleConfirmPublish`, `canPublish`).
- `[x]` Шаг 3: добавлен `useBuilderPreviewPublishActions.test.ts` (3 кейса).
- `[x]` Шаг 4: проверки выполнены.
  : `vitest --run components/builder/autosave/useBuilderDraftAutosave.test.ts components/builder/autosave/useBuilderPreviewPublishActions.test.ts` — 5/5 тестов зеленые.
  : `eslint` по новым autosave-файлам — без ошибок; в `BuilderShell.tsx` остаются старые предупреждения `react-hooks/exhaustive-deps` вне рамок этой итерации.

## Вариант 5: Рефакторинг BuilderShell

Цель: сделать `BuilderShell` тонким orchestration-слоем, сократить связанность и упростить поддержку без изменения текущего поведения.

1. Зафиксировать baseline:
   - снять текущие метрики (`BuilderShell.tsx`: размер, число hooks, lint warnings);
   - зафиксировать текущие smoke-тесты как baseline для регрессий.

2. Стабилизировать hooks в текущем `BuilderShell`:
   - закрыть предупреждения `react-hooks/exhaustive-deps`;
   - убрать нестабильные inline-функции из deps через `useCallback`/ref-wrapper там, где нужно.

3. Разделить доменную логику на hooks:
   - `useBuilderShellData` (apps/pages/queries/js/runtime/draft + mutations);
   - `useBuilderShellSelection` (selected node, active page, inspector routing);
   - `useBuilderShellLayoutOps` (add/move/delete/update widgets/frames/layout slots);
   - `useBuilderShellCodeOps` (tabs/selection/query-run state);
   - `useBuilderShellThemeSync` (theme init/save/debounce);
   - `useBuilderShellDialogs` (create/publish/preview dialog state).

4. Вынести производные селекторы в чистые функции:
   - тяжелые `useMemo` вычисления в `builder-shell/selectors.ts`;
   - в `BuilderShell` оставить только wiring.

5. Разделить UI-композицию:
   - `BuilderShell` (controller) + `BuilderShellView` (presentational);
   - вынести крупные секции: topbar/actions, workspace, dialogs/modals.

6. Упростить контракт shell -> canvas/sidebar/inspector:
   - где безопасно, перейти от россыпи callback-пропсов к action-слою (`onWidgetAction`, `onFrameAction`) без breaking API.

7. Тесты:
   - unit-тесты новых hooks;
   - интеграционный smoke `BuilderShell` (add widget, select node, preview/publish, autosave trigger).

8. Финишный контроль:
   - `eslint` без новых warnings;
   - целевые `vitest` — зеленые;
   - обновление статуса в этом файле.

### Статус выполнения варианта 5

- `[x]` Шаг 1: baseline.
  : `BuilderShell.tsx` сокращен с `4227` до `3396` строк после декомпозиции shell-слоя.
  : baseline по проверкам перед итерацией: `eslint` выдавал hook warnings в `BuilderShell` + архитектурную ошибку `barrel-files/avoid-re-export-all`.
- `[x]` Шаг 2: стабилизация hooks/deps.
  : warnings `react-hooks/exhaustive-deps` в `BuilderShell` закрыты.
  : нестабильный `handleDeleteWidget` переведен на `useCallback`.
- `[x]` Шаг 3: декомпозиция на hooks.
  : добавлены и подключены:
    - `components/builder/shell/hooks/useBuilderShellData.ts`
    - `components/builder/shell/hooks/useBuilderShellSelection.ts`
    - `components/builder/shell/hooks/useBuilderShellCodeOps.ts`
    - `components/builder/shell/hooks/useBuilderShellPageOps.ts`
    - `components/builder/shell/hooks/useBuilderShellBootstrap.ts`
    - `components/builder/shell/hooks/useBuilderShellPanelSync.ts`
    - `components/builder/shell/hooks/useBuilderShellAssistantSync.ts`
    - `components/builder/shell/hooks/useBuilderShellInspectorEffects.ts`
    - `components/builder/shell/hooks/useBuilderShellRuntimeContexts.ts`
    - `components/builder/shell/hooks/useBuilderShellThemeSync.ts`
    - `components/builder/shell/hooks/useBuilderShellDialogs.ts`
    - `components/builder/shell/hooks/useBuilderShellWidgetOps.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetCrudOps.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetLayoutOps.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetDndOps.ts`
  : `shell/hooks/index.ts` переведен на явные re-export (без `export *`).
  : widget CRUD/layout/dnd операции вынесены из `BuilderShell` в `useBuilderShellWidgetOps` (без изменения публичных callback-контрактов shell view).
  : `useBuilderShellWidgetOps` стал compositor-слоем, объединяющим 3 подхука вместо монолита 1:1.
- `[x]` Шаг 4: селекторы.
  : парсинг и нормализация code/url/localStorage вынесены в `components/builder/shell/selectors.ts`.
  : ID/clone/event-ref helper-ы дерева виджетов вынесены в `components/builder/shell/widget-tree-utils.ts`.
  : preset helper-ы системных frame-виджетов вынесены в `components/builder/shell/frame-presets.ts`.
- `[x]` Шаг 5: разделение controller/view.
  : вынесены UI-секции `topbar/actions`, `publish dialog`, `apps catalog/create`, `workspace`, `inspector pane`:
    - `components/builder/shell/components/BuilderHeaderActions.tsx`
    - `components/builder/shell/components/BuilderPublishDialog.tsx`
    - `components/builder/shell/components/BuilderAppsCatalogView.tsx`
    - `components/builder/shell/components/BuilderShellView.tsx`
    - `components/builder/shell/components/BuilderInspectorPane.tsx`
  : `BuilderShell` переведен на view-бандлы (`sidebarProps`, `canvasProps`, `inspectorPaneProps`) вместо inline JSX.
- `[x]` Шаг 6: унификация action-контрактов.
  : в `BuilderShell` введены action-bundles `sidebarActionProps` и `canvasActionProps` вместо россыпи inline callback-props.
- `[x]` Шаг 7: тесты.
  : добавлены unit/smoke тесты новых shell-модулей:
    - `components/builder/shell/hooks/useBuilderShellCodeOps.test.ts`
    - `components/builder/shell/hooks/useBuilderShellSelection.test.ts`
    - `components/builder/shell/hooks/useBuilderShellPageOps.test.ts`
    - `components/builder/shell/hooks/useBuilderShellBootstrap.test.ts`
    - `components/builder/shell/hooks/useBuilderShellPanelSync.test.ts`
    - `components/builder/shell/hooks/useBuilderShellAssistantSync.test.ts`
    - `components/builder/shell/hooks/useBuilderShellInspectorEffects.test.ts`
    - `components/builder/shell/hooks/useBuilderShellRuntimeContexts.test.ts`
    - `components/builder/shell/widget-tree-utils.test.ts`
    - `components/builder/shell/frame-presets.test.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetCrudOps.test.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetLayoutOps.test.ts`
    - `components/builder/shell/hooks/widget-ops/useBuilderShellWidgetDndOps.test.ts`
    - `components/builder/shell/components/BuilderAppsCatalogView.test.tsx`
    - `components/builder/shell/components/BuilderInspectorPane.test.tsx`
    - `components/builder/BuilderShell.test.tsx`
  : добавлен controller-level smoke `BuilderShell`: add widget, select node, save draft, preview/publish.
- `[x]` Шаг 8: финальный контроль и фиксация.
  : `eslint` по `BuilderShell` + shell hooks/components — green.
  : `vitest` целевые shell+autosave+widget-ops+runtime-contexts+page-ops+bootstrap+panel/assistant/inspector-effects+widget-tree-utils+frame-presets тесты — green (`27/27`).

## Вариант 6: Глубокая декомпозиция BuilderCanvas

Цель: продолжить cleanup `BuilderCanvas`, сохранив внешний `BuilderCanvasProps` и текущее поведение DnD/quick-add/resize.

1. Вынести drop-target engine в отдельный модуль:
   - `canvas/engines/dropTargetEngine.ts`;
   - `resolveDropZoneFromPoint`, `resolveDropLayoutInZone`, `buildDropPreviewStyle`, container zone validation.

2. Вынести drag/resize orchestration в hook:
   - `canvas/hooks/useCanvasInteractions.ts`;
   - external drag over/drop, internal drag pointer/update, frame resize lifecycle.

3. Разделить рендер на слои:
   - `canvas/layers/CanvasAppFramesLayer.tsx`;
   - `canvas/layers/CanvasPageLayer.tsx`;
   - `canvas/layers/CanvasOverlayLayer.tsx`.

4. Вынести layout-подготовку в selectors:
   - `canvas/selectors/layoutSelectors.ts`;
   - `buildLayoutMap`, `normalizeLayout`, служебные derived helpers.

5. Унифицировать контракт слоев:
   - перейти к объектам `canvasState` и `canvasActions` в layer-компонентах;
   - уменьшить объем prop drilling.

6. Добавить тесты на выделенные алгоритмы:
   - `dropTargetEngine.test.ts`;
   - `layoutSelectors.test.ts`;
   - `useCanvasInteractions.test.ts`.

7. Финальный контроль:
   - `BuilderCanvas` заметно сокращен (целевой диапазон: ~700-900 строк, без жесткого breaking требования);
   - `eslint` и целевые `vitest` зеленые;
   - статус зафиксирован в этом плане.

### Статус выполнения варианта 6

- `[x]` Шаг 1: drop-target engine.
- `[x]` Шаг 2: useCanvasInteractions.
- `[x]` Шаг 3: layer-компоненты.
- `[x]` Шаг 4: layout selectors.
- `[x]` Шаг 5: state/actions contract.
- `[x]` Шаг 6: тесты.
- `[x]` Шаг 7: финальный контроль.

Фиксация результата (2026-02-16):
- `BuilderCanvas` очищен от дублирующихся веток, DnD/resize orchestration делегирован в `useCanvasInteractions`.
- Вынесены engine/selectors/layers модули и подключены в основной рендер.
- Добавлены тесты:
  - `components/builder/canvas/engines/dropTargetEngine.test.ts`;
  - `components/builder/canvas/selectors/layoutSelectors.test.ts`;
  - `components/builder/canvas/hooks/useCanvasInteractions.test.ts`.
- Проверки:
  - `eslint` по затронутым canvas-файлам — green;
  - целевые `vitest` (3 файла, 10 тестов) — green.

## Вариант 7: Дальнейший cleanup BuilderCanvas

Цель: дополнительно упростить `BuilderCanvas` и уменьшить связность, не меняя внешний API.

1. Вынести widget-action runtime:
   - `canvas/hooks/useCanvasWidgetActions.ts`;
   - `normalizeEvents` + обработка `setHidden` в frame scope.

2. Вынести grid/render orchestration:
   - `canvas/hooks/useCanvasGridRenderer.tsx`;
   - `renderCanvasGrid`, `renderGrid`, `renderGlobalGrid`, `buildContainerDropOptions`, interaction handlers.

3. Perf-pass:
   - мемоизация тяжелых секций (`pageMainSection`, frame renderers);
   - уменьшение пересоздания callback-цепочек в `BuilderCanvas`.

4. Проверки:
   - линт по затронутым файлам;
   - тесты для `useCanvasWidgetActions` + целевые canvas-тесты.

### Статус выполнения варианта 7

- `[x]` Шаг 1: план зафиксирован.
- `[x]` Шаг 2: widget-action runtime вынесен.
- `[x]` Шаг 3: grid/render orchestration вынесен.
- `[x]` Шаг 4: perf-pass выполнен.
- `[x]` Шаг 5: проверки и фиксация результата.

Фиксация результата (2026-02-16):
- `BuilderCanvas` сокращен до orchestration-компонента (`422` строки против `~1042`).
- Вынесен widget-action runtime:
  - `components/builder/canvas/hooks/useCanvasWidgetActions.ts`.
- Вынесен grid/render orchestration:
  - `components/builder/canvas/hooks/useCanvasGridRenderer.tsx`.
- В `BuilderCanvas` добавлена memoization точек сборки:
  - `createCanvasFrameRenderers` через `useMemo`;
  - `pageMainSection` через `useMemo`.
- Добавлен тест:
  - `components/builder/canvas/hooks/useCanvasWidgetActions.test.ts`.
- Проверки:
  - `eslint` по затронутым canvas-файлам — green;
  - целевые `vitest` (4 файла, 14 тестов) — green.

## Вариант 8: Cleanup createCanvasFrameRenderers

Цель: уменьшить связность renderer-слоя frames/overlays без изменения публичного контракта.

1. Вынести модельные вычисления frame renderer:
   - `canvas/renderers/frameRendererHelpers.ts`;
   - global frame context, overlay frame context, slot selection, grid option routing.

2. Упростить `createCanvasFrameRenderers.tsx` до orchestration:
   - оставить JSX и wiring;
   - убрать вычислительную часть из основного файла.

3. Добавить тесты helper-слоя:
   - `canvas/renderers/frameRendererHelpers.test.ts`.

4. Проверки:
   - `eslint` по затронутым renderer/canvas файлам;
   - целевые `vitest`.

### Статус выполнения варианта 8

- `[x]` Шаг 1: helpers вынесены.
- `[x]` Шаг 2: renderer orchestration упрощен.
- `[x]` Шаг 3: тесты добавлены.
- `[x]` Шаг 4: проверки выполнены.

Фиксация результата (2026-02-16):
- Добавлен `components/builder/canvas/renderers/frameRendererHelpers.ts`.
- `components/builder/canvas/renderers/createCanvasFrameRenderers.tsx` переведен на helper-модели.
- Добавлен тест `components/builder/canvas/renderers/frameRendererHelpers.test.ts`.
- Проверки:
  - `eslint` — green;
  - `vitest` целевые canvas tests — 5 файлов, 17 тестов, green.

## Вариант 9: Финальная декомпозиция Canvas слоя

Цель: завершить структурный cleanup canvas-модулей и закрыть оставшийся техдолг по связности/типизации.

1. Декомпозировать grid renderer:
   - выделить `useCanvasPageGridRenderer`;
   - выделить `useCanvasFrameGridRenderer`;
   - выделить `renderCanvasGridBase`.

2. Разделить `useCanvasInteractions`:
   - `external DnD`;
   - `internal DnD`;
   - `frame resize`.

3. Разгрузить `CanvasCard`:
   - `useCanvasCardAutoHeight`;
   - `useCanvasCardPressToDrag`.

4. Закрыть `any` в `CanvasCard`:
   - убрать `widget.props as any` через typed render adapter.

5. Добавить интеграционные тесты canvas-сценариев:
   - DnD в nested container slot;
   - move container -> page root;
   - overlay `closeOnOutsideClick` / `showOverlay`;
   - quick-add в slot containers.

### Статус выполнения варианта 9

- `[x]` Шаг 1: план зафиксирован.
- `[x]` Шаг 2: grid renderer декомпозирован.
- `[x]` Шаг 3: interactions декомпозированы.
- `[x]` Шаг 4: CanvasCard декомпозирован.
- `[x]` Шаг 5: `any` устранен.
- `[x]` Шаг 6: интеграционные тесты добавлены.
- `[x]` Шаг 7: проверки и фиксация результата.

Фиксация результата (2026-02-16):
- Grid renderer разбит на модули:
  : `components/builder/canvas/hooks/useCanvasGridRendererBase.tsx`
  : `components/builder/canvas/hooks/useCanvasPageGridRenderer.tsx`
  : `components/builder/canvas/hooks/useCanvasFrameGridRenderer.tsx`
- `useCanvasInteractions` разделен на сценарии:
  : `components/builder/canvas/hooks/useCanvasExternalDnd.ts`
  : `components/builder/canvas/hooks/useCanvasInternalDnd.ts`
  : `components/builder/canvas/hooks/useCanvasFrameResize.ts`
- `CanvasCard` разгружен в hooks:
  : `components/builder/canvas/hooks/useCanvasCardAutoHeight.ts`
  : `components/builder/canvas/hooks/useCanvasCardPressToDrag.ts`
- В `CanvasCard` убран `widget.props as any`, рендер переведен на typed adapter.
- Добавлены/обновлены тесты по целевым сценариям:
  : `components/builder/canvas/hooks/useCanvasGridRendererBase.test.ts`
  : `components/builder/canvas/hooks/useCanvasInteractions.test.ts`
  : `components/builder/canvas/renderers/frameRendererHelpers.test.ts`
- Дополнительно стабилизирован drop-target fallback для test/runtime окружений без `document.elementsFromPoint`.
- Проверки:
  : `eslint` по canvas-модулям — green.
  : `vitest` (6 файлов, 22 теста) — green.

## Вариант 10: Унификация Adjacent DnD правил

Цель: убрать рассыпанную `Adjacent`-логику из hooks в единый engine-слой и снизить связность canvas DnD.

1. Вынести Adjacent engine:
   - определение цели под курсором (`above|below`);
   - проверка попадания в `child-drop-zone`;
   - правило применения adjacent-вставки только для page-root drop.

2. Перевести `useCanvasExternalDnd` на engine:
   - убрать прямую DOM-логику из hook;
   - использовать единый comparator для состояния `externalDropTarget`.

3. Перевести `useCanvasPageGridRenderer` на engine-правила:
   - убрать inline-проверки adjacent-вставки в `onDrop`.

4. Убрать дубли типа `AdjacentDropTarget`:
   - использовать единый тип из engine в hooks/grid.

5. Добавить/обновить тесты и проверки.

### Статус выполнения варианта 10

- `[x]` Шаг 1: Adjacent engine вынесен.
- `[x]` Шаг 2: `useCanvasExternalDnd` переведен на engine.
- `[x]` Шаг 3: `useCanvasPageGridRenderer` переведен на engine-правила.
- `[x]` Шаг 4: дубли типа `AdjacentDropTarget` устранены.
- `[x]` Шаг 5: тесты и проверки выполнены.

Фиксация результата (2026-02-16):
- В `components/builder/canvas/engines/dropTargetEngine.ts` добавлены:
  : `resolveAdjacentDropTargetFromPoint`
  : `isPointInsideCanvasChildDropZone`
  : `shouldInsertAdjacentWidgetInGridDrop`
  : `areAdjacentDropTargetsEqual`
  : `AdjacentDropTarget` / `AdjacentDropPosition`.
- `components/builder/canvas/hooks/useCanvasExternalDnd.ts` переведен на engine helper-ы.
- `components/builder/canvas/hooks/useCanvasPageGridRenderer.tsx` использует `shouldInsertAdjacentWidgetInGridDrop`.
- В hooks/grid устранены локальные дубли `AdjacentDropTarget`:
  : `useCanvasDndState.ts`
  : `useCanvasInteractions.types.ts`
  : `useCanvasGridRendererBase.tsx`
  : `useCanvasGridRenderer.tsx`
  : `useCanvasFrameGridRenderer.tsx`
  : `useCanvasPageGridRenderer.tsx`.
- Обновлены тесты:
  : `components/builder/canvas/engines/dropTargetEngine.test.ts` (7 тестов).
- Проверки:
  : `eslint` по затронутым файлам — green;
  : `vitest` целевые canvas-тесты (3 файла, 15 тестов) — green.

## Вариант 11: Перенос BuilderCanvas в canvas/index

Цель: завершить модульную структуру canvas-слоя и убрать корневой `BuilderCanvas.tsx` из папки `builder`.

1. Перенести файл:
   - `components/builder/BuilderCanvas.tsx` -> `components/builder/canvas/index.tsx`.

2. Обновить импорт в shell:
   - `BuilderShell` должен импортировать canvas через `./canvas`.

3. Актуализировать относительные импорты внутри canvas entrypoint.

4. Прогнать проверки по затронутым файлам.

### Статус выполнения варианта 11

- `[x]` Шаг 1: файл перенесен в `canvas/index.tsx`.
- `[x]` Шаг 2: импорт в `BuilderShell` обновлен.
- `[x]` Шаг 3: относительные импорты внутри entrypoint обновлены.
- `[x]` Шаг 4: проверки выполнены.

Фиксация результата (2026-02-16):
- Новый entrypoint canvas: `components/builder/canvas/index.tsx`.
- Обновлен импорт в `components/builder/BuilderShell.tsx` на `import { BuilderCanvas } from './canvas'`.
- `eslint` по затронутым файлам (`BuilderShell.tsx`, `canvas/index.tsx`) — без ошибок (остались только существующие warnings `react-hooks/exhaustive-deps` в `BuilderShell.tsx`).

## Вариант 12: Перенос ResizeHandles в canvas-модуль

Цель: завершить перенос canvas-специфичной инфраструктуры из `builder/*` в `builder/canvas/*`.

1. Перенести `BuilderResizeHandles` в `canvas`.
2. Обновить импорты в grid/selectors.
3. Прогнать проверки.

### Статус выполнения варианта 12

- `[x]` Шаг 1: `BuilderResizeHandles` перенесен в `canvas/resize-handles.tsx`.
- `[x]` Шаг 2: импорты обновлены в `useCanvasGridRendererBase` и `layoutSelectors`.
- `[x]` Шаг 3: проверки выполнены.

Фиксация результата (2026-02-16):
- Перенесен файл:
  : `components/builder/canvas/resize-handles.tsx`.
- Обновлены импорты:
  : `components/builder/canvas/hooks/useCanvasGridRendererBase.tsx`
  : `components/builder/canvas/selectors/layoutSelectors.ts`.
- Проверки:
  : `eslint` по затронутым файлам — green;
  : `vitest` (`layoutSelectors.test.ts`, `useCanvasGridRendererBase.test.ts`) — green.
