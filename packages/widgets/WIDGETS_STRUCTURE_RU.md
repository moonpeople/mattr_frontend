# Архитектура Виджетов (простыми словами)

Этот файл объясняет, как устроены виджеты в проекте: где что лежит, кто за что отвечает, и как проходит путь от JSON-конфига до UI в Builder/Preview.

## 1) Самая короткая схема

1. Виджет описывается в `definition` (тип, default props, render).
2. Виджет регистрируется в runtime-реестре.
3. Для виджета есть конфиг инспектора (какие поля показать и как).
4. Builder по типу виджета берет этот конфиг и рисует контролы.
5. Preview берет `definition.render(...)` и рендерит виджет с вычисленными значениями.

## 2) Где лежат файлы

Основные места:

- Runtime экспорт: `mattr/packages/widgets/runtime.ts`
- Inspector экспорт: `mattr/packages/widgets/inspector.ts`
- Базовые типы виджетов: `mattr/packages/widgets/src/types.ts`
- Реестр всех runtime-виджетов: `mattr/packages/widgets/src/registry.ts`
- Реестр инспектора: `mattr/packages/widgets/src/inspector/registry.ts`
- База полей инспектора: `mattr/packages/widgets/src/inspector/fieldRegistry.ts`
- Пер-виджетные инспекторы: `mattr/packages/widgets/src/inspector/widgets/*.inspector.ts`
- Реализация виджетов: `mattr/packages/widgets/src/definitions/*.definition.tsx`
- Тонкие обертки виджетов: `mattr/packages/widgets/src/widgets/*.tsx`
- Рендер контролов инспектора: `mattr/apps/builder/components/builder/BuilderInspectorSections.tsx`
- Основной инспектор Builder: `mattr/apps/builder/components/builder/BuilderInspector.tsx`
- Рендер виджетов в preview/runtime: `mattr/apps/builder/components/builder/runtime/renderWidgetTree.tsx`

## 3) Что такое `definition`

`definition` это главный контракт виджета.

Смотрим тип в `mattr/packages/widgets/src/types.ts`:

- `type`: внутренний тип (`Table`, `Select`, `Navigation` и т.д.).
- `label`: подпись в UI.
- `category`: категория в панели компонентов.
- `defaultProps`: дефолтные пропсы.
- `render(props, context)`: как реально рисовать виджет.
- `events`, `layout`, `supportsChildren`, `builder`: доп. мета.

Создается через `createWidgetDefinition(...)`.

## 4) Что такое runtime-реестр

Файл: `mattr/packages/widgets/src/registry.ts`

Что делает:

- Импортирует все `*.definition.tsx`.
- Складывает их в массив `registry`.
- Обогащает builder-конфигом событий (`eventOptions`, `eventActionOptions`).
- Отдает функции:
  - `getWidgetDefinition(type)` — вернуть definition по типу.
  - `widgetRegistry` — весь список виджетов.
  - `widgetCategories` — сгруппированные категории.

Именно отсюда Canvas/Preview узнают, как рендерить любой виджет.

## 5) Что такое Inspector-архитектура

### 5.1 База полей

Файл: `mattr/packages/widgets/src/inspector/fieldRegistry.ts`

Тут один большой `Map<string, WidgetField>`, где описаны базовые поля:

- `type` поля (`text`, `json`, `select`, `boolean`, `number`, ...)
- `label`, `section`, `placeholder`
- `valueType`, `supportsFx`, `dependsOn`
- `control` (например `collectionItems`, `collectionColumns`, `typography`)

Также тут:

- `resolveInspectorFields(...)` — взять ключи и собрать реальные поля.
- `buildInspectorConfig(...)` — удобный билдер конфига инспектора.

### 5.2 Конфиг конкретного виджета

Файл формата: `mattr/packages/widgets/src/inspector/widgets/<Widget>.inspector.ts`

Обычно там:

- список `fieldKeys`
- `buildInspectorConfig(fieldKeys, overrides)`

То есть виджет выбирает нужные базовые поля и локально их переопределяет.

### 5.3 Реестр инспектора

Файл: `mattr/packages/widgets/src/inspector/registry.ts`

Тут `Map<widgetType, WidgetInspectorConfig>`.

`getWidgetInspector(type)` делает:

1. Берет конфиг виджета из map.
2. Если есть только `fieldKeys`, разворачивает их через `fieldRegistry`.
3. Добавляет глобальные style-поля (через `widgetStyleFields.ts`).
4. Возвращает финальный список `fields`.

## 6) Как Builder решает, что рисовать: input или code editor

Файл: `mattr/apps/builder/components/builder/BuilderInspectorSections.tsx`

Ключевая логика:

- Для `field.type === 'text'` рисуется текстовый `Input`.
- Для `field.type === 'textarea'` рисуется `Textarea`.
- Для `field.type === 'json'` по умолчанию рисуется `CodeEditor`.
- Исключения для `json`:
  - `control: 'collectionItems'` -> кастомный editor списка items.
  - `control: 'collectionColumns'` -> кастомный editor колонок table.

Поэтому причина поведения всегда в комбинации `field.type` + `field.control`, а не в названии поля (`data`, `items`, и т.д.).

## 7) Table: как устроено сейчас

### 7.1 Runtime

Файл: `mattr/packages/widgets/src/definitions/Table.definition.tsx`

Главное:

- `data` — источник данных (ожидается массив объектов).
- `columnsMode`: `manual | mapped`.
- `columns` — массив колонок (`Column[]`).
- `primaryKey` — ключ строки.
- `filterStack` — JSON фильтров.

В рантайме:

- `data` парсится и нормализуется.
- ключи из данных могут быть выведены автоматически.
- в `mapped` режиме колонки могут выводиться из ключей входных данных.

### 7.2 Inspector

Файл: `mattr/packages/widgets/src/inspector/widgets/Table.inspector.ts`

Поля:

- `data`
- `columnsMode`
- `columns` (`control: 'collectionColumns'`)
- `primaryKey`
- `filterStack`
- и др. (`showHeader`, `striped`, `searchable`, `rowLimit`, `events`)

### 7.3 UI Columns (редактор колонок)

Файл: `mattr/apps/builder/components/builder/BuilderInspectorSections.tsx`

Ключевые части:

- `TableColumnsFieldControl` — весь UI списка колонок.
- `resolveDataSourceKeys(...)` — анализирует `table.data` и достает ключи.
- `parseTableColumns(...)` — нормализует `columns`.
- `openColumnPanel(...)` — открывает колонку в инспекторе через `panel key = table-column:<index>`.
- `parseTableColumnPanelIndex(...)` — читает этот ключ обратно.

Именно этот контрол отвечает за список колонок, панель колонки, меню `...`, add/remove/regenerate.

### 7.4 Почему `Primary key` как select по ключам data

В `BuilderInspectorSections.tsx` есть `resolvePrimaryKeyOptions()`:

- если редактируется поле `primaryKey`, оно берет `widgetProps.data`
- парсит массив объектов
- собирает ключи (`id`, `name`, ...)
- строит `select options` из этих ключей

## 8) Общая `item`-структура (для Select/Cascader/MultiSelect/Listbox/MultiSelectListbox)

Сейчас используется единый подход через `items`:

- `itemsMode` (`static`/`dynamic`)
- `items` (ручной список)
- `itemsData` + `itemLabelKey` + `itemValueKey` (+ доп. key-поля)

Это видно в:

- `mattr/packages/widgets/src/definitions/Select.definition.tsx`
- `mattr/packages/widgets/src/inspector/widgets/Select.inspector.ts`
- `mattr/packages/widgets/src/inspector/widgets/Cascader.inspector.ts`
- `mattr/packages/widgets/src/inspector/widgets/MultiSelect.inspector.ts`
- `mattr/packages/widgets/src/inspector/widgets/Listbox.inspector.ts`
- `mattr/packages/widgets/src/inspector/widgets/MultiSelectListbox.inspector.ts`

Для UI редактирования используется `control: 'collectionItems'` в инспекторе.

## 9) Примеры по виджетам data-группы

### Filter

- Runtime: `mattr/packages/widgets/src/definitions/Filter.definition.tsx`
- Inspector: `mattr/packages/widgets/src/inspector/widgets/Filter.inspector.ts`
- Работает через `FilterStack` (`operator + filters[]`), поддерживает `apply`/`change` events.

### ReorderableList

- Runtime: `mattr/packages/widgets/src/definitions/ReorderableList.definition.tsx`
- Inspector: `mattr/packages/widgets/src/inspector/widgets/ReorderableList.inspector.ts`
- Держит состояние reorder (`fromIndex`, `toIndex`, `values`, `count`), шлет `reorder` и `change`.

### KeyValue

- Runtime: `mattr/packages/widgets/src/definitions/KeyValue.definition.tsx`
- Inspector: `mattr/packages/widgets/src/inspector/widgets/KeyValue.inspector.ts`
- На вход можно object или array; в runtime нормализуется в `entries[]`.

### JsonExplorer

- Runtime: `mattr/packages/widgets/src/definitions/JsonExplorer.definition.tsx`
- Inspector: `mattr/packages/widgets/src/inspector/widgets/JsonExplorer.inspector.ts`
- Состояние: `expandedPathList`, `highlightedPathList`, `search`, `count`.

## 10) Полный путь данных (from config to screen)

1. Builder хранит `BuilderWidgetInstance` (`mattr/apps/builder/components/builder/types.ts`).
2. По `widget.type` берет `definition` из `getWidgetDefinition(...)`.
3. Inspector берет `getWidgetInspector(type)` и рисует поля.
4. Пользователь меняет поле -> patch в `widget.props`.
5. Preview (`renderWidgetTree.tsx`) объединяет `defaultProps + props + state`.
6. Вычисляет FX/шаблоны через `resolveValue(...)`.
7. Вызывает `definition.render(resolvedProps, context)`.
8. Виджет рендерится и через `context.setState/runActions` обновляет runtime state.

## 11) Как добавить новый виджет без боли

1. Создать runtime файл `src/definitions/<Name>.definition.tsx`.
2. Создать обертку `src/widgets/<Name>.tsx`.
3. Добавить definition в `src/registry.ts`.
4. Создать инспектор `src/inspector/widgets/<Name>.inspector.ts`.
5. Зарегистрировать инспектор в `src/inspector/registry.ts`.
6. При необходимости добавить базовые поля в `src/inspector/fieldRegistry.ts`.
7. Если нужно особое UI-поле инспектора, добавить `control` и отрисовку в `BuilderInspectorSections.tsx`.

## 12) Частые ошибки

1. Поле ожидается как `Input`, но `type: 'json'` рендерит `CodeEditor`.
2. Забыли добавить виджет в `src/registry.ts` — виджет не рендерится в runtime.
3. Забыли добавить в `inspector/registry.ts` — нет полей в инспекторе.
4. Неправильный `dependsOn` — поле “пропадает” в UI.
5. Несогласованные `valueType`/`supportsFx` — странное поведение FX.

## 13) Полный список зарегистрированных типов виджетов

Список ниже взят из `mattr/packages/widgets/src/registry.ts` (`const registry`):

```txt
Text, AgentChat, Chat, CommentThread, Button, OutlineButton, CloseButton, ButtonGroup,
AuthLogin, Breadcrumbs, Link, LinkCard, LinkList, Calendar, Cascader, TextInput,
NumberInput, Currency, Percent, Email, Url, ColorInput, TextArea, TextEditor,
EditableNumber, PasswordInput, Microphone, EditableText, EditableTextArea, SignaturePad,
PhoneNumberInput, OtpInput, Select, SegmentedControl, MultiSelect, Listbox,
MultiSelectListbox, RadioGroup, Checkbox, CheckboxGroup, CheckboxTree, ToggleButton,
ToggleLink, Switch, SwitchGroup, Slider, RangeSlider, DatetimeInput, CalendarInput, Date,
DateTime, DateRange, Day, Month, Time, Year, DatePicker, DateTimePicker, DateRangePicker,
TimePicker, FileUpload, DropdownButton, Drawer, SplitButton, SplitPane, Statistic, Tags,
ProgressBar, ProgressCircle, Rating, Divider, Filter, Steps, Pagination, PageInput,
ReorderableList, JsonEditor, JsonExplorer, JsonSchemaForm, Html, IFrame, Looker, Map,
PdfViewer, ImageGrid, QRCode, Video, Alert, AvatarGroup, StripeCardForm, Status,
TextAnnotation, BoundingBox, Scanner, Timer, Timeline, KeyValue, KeyValueMap, Header,
Sidebar, GlobalHeader, GlobalSidebar, GlobalDrawer, GlobalModal, GlobalSplitPane,
DrawerHeader, DrawerFooter, DrawerTitle, DrawerCloseButton, ModalHeader, ModalFooter,
ModalTitle, ModalCloseButton, Navigation, Container, CollapsibleContainer, Stack, Tabs,
TabbedContainer, SteppedContainer, Wizard, Modal, Form, Table, ListView, Chart, Image,
Avatar, Icon, Spacer
```
