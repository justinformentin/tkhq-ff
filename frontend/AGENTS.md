# Dashboard V2

## Route Files

- Route page files (`src/routes/*.tsx`) must be **thin orchestrators under 150 lines** (enforced via ESLint `max-lines` rule).
- **No business logic in route files.** Data fetching, derived state, and mutations belong in shared hooks (e.g. `hooks/users/useUserDetail.ts`). Route components should only compose UI components and manage simple UI state like dialog open/close.
- **Extract large sections into components.** Tables with delete flows, form sections, etc. should be self-contained components in a `-components/` subdirectory, owning their own state.
- **Routes must be nested under folders**, not flat at the top level. Use `routes/users/index.tsx`, not `routes/users.index.tsx`. Group related routes under a shared directory.
- Common helpers (e.g. `formatDate`) go in `lib/` — never duplicate across files.

## Design System

### Tokens

All styles must use shared design tokens. **Never hardcode hex colors** (e.g. `#4c48ff`) or raw pixel values when a token exists.

Available semantic tokens (defined in `src/styles/globals.css`):

- **Colors:** `foreground`, `background`, `primary`, `secondary`, `muted`, `muted-foreground`, `destructive`, `success`, `border`, `ring`
- **Brand palette:** `purple-50`, `purple-500`, `purple-600`, `green-50`, `green-500`, `green-600`, `blue-50`, `blue-600`
- **Opacity modifiers:** Use Tailwind syntax like `purple-500/12` for transparent variants — don't use raw `rgba()`.
- **Typography:** `font-display` (ABC Favorit), `font-sans` (Inter), `font-roboto` (Roboto). Size tokens via CSS variables: `--text-page-title`, `--text-section-heading`, `--text-stat-value`, `--text-setting-title`, `--text-card-title`.

If a needed token doesn't exist, add it to the design system (`globals.css`) rather than inlining a raw value.

### Primitives

Always use existing UI primitives before building custom markup. The following are available in `src/components/ui/`:

| Component                                                                 | Use for                                                                                                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                                                                  | All interactive buttons. Variants: `default`, `outline`, `ghost`, `destructive`, `secondary`, `chip`, `link`. Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg` |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | All tabular data. Includes built-in hover states and border styling                                                                                                      |
| `DataTable`                                                               | TanStack-backed data tables with sorting, filtering, pagination                                                                                                          |
| `Card`, `CardHeader`, `CardContent`, `CardFooter`                         | Content containers with shadow and border                                                                                                                                |
| `Dialog`                                                                  | Modal dialogs with `Dialog.Header`, `Dialog.Footer`, `Dialog.Separator`                                                                                                  |
| `Icon`                                                                    | All icons — never import from `@untitledui/icons` directly                                                                                                               |
| `Pill`                                                                    | Tags and status badges. Variants: `default`, `muted`, `primary`, `destructive`, `warning`, `outline`                                                                     |
| `CopyableValue`                                                           | Truncated IDs/keys with copy-to-clipboard                                                                                                                                |
| `Separator`                                                               | Horizontal and vertical dividers                                                                                                                                         |
| `Skeleton`                                                                | Loading placeholders                                                                                                                                                     |
| `PageTitle`, `SectionHeading`, `Text`                                     | Typography — use `Text` variant prop (`body`, `label`, `muted`, `caption`, `column-header`, `stat`, `setting-title`) instead of raw classes                              |

### Forms

Form primitives live in `src/components/form/`:

- `Field`, `FieldLabel`, `FieldContent`, `FieldGroup`, `FieldSet` — structured form layouts
- `Input`, `Select`, `SecretInput` — form controls

### Icons

Use the `Icon` component with the `name` prop. Available names are defined in `ICON_NAMES` in `src/components/ui/icon.tsx`. If an icon is missing, add it to the registry there — don't import from `@untitledui/icons` directly.
