# Builder Inspector Structure

This folder is split by responsibility:

- `inspectors/`: top-level inspector screens (widget/frame/page/app/overlay/page-component).
- `inspectors/sections/`: section-level view blocks and list section components used by `BuilderInspectorSections`.
- `inspectors/rows/`: reusable row renderers for field, inline-field, and list rows.
- `inspectors/controls/`: field control rendering engine and control-specific helpers.
  Shared runtime contract lives here: `InspectorControlRuntime` (FX handlers, completion context, theme tokens, panel hooks).
- `inspectors/hooks/`: inspector-specific hooks for complex state blocks (`useInspectorFxRuntime`, `useInspectorSectionGroups`).
- `features/`: large domain blocks used by inspectors (`events`, `table-columns`, `collection-items`).
- `model/`: shared inspector contracts and pure helpers (`panel-keys`, `section-config`, `sections-schema`, `fx`, `style-fallback`).
- `shared/`: reusable inspector UI fragments (`InspectorEmptyState`, `InspectorFieldLabel`, `InspectorRow`, `ShortcutRow`, etc).
- `index.ts`: public entrypoint for imports from outside the inspector module.

Import rules:

1. External modules should import from `components/builder/inspector` (barrel) when possible.
2. Shared contracts/helpers and schema builders must live in `model/` instead of screen files.
3. Large custom controls must live in `features/` and be consumed by `inspectors/`.
4. Reusable UI fragments must live in `shared/` instead of duplicating in multiple inspectors.
