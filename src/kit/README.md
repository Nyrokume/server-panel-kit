# Panel kit

Собственная дизайн-система проекта «Пульт». Заменяет дефолтную библиотеку shadcn/ui как
основной визуальный слой: токены, примитивы и блоки — наши. Под капотом используются
headless-примитивы `radix-ui` (Dialog, Tooltip, Select, Switch, Tabs, DropdownMenu,
ToggleGroup, Slot) — только для доступности и поведения; весь внешний вид, API и токены
определяются здесь.

Философия: **минимализм**. Монохромная база, один сдержанный акцент, статусные цвета
только для реальных состояний, волосяные разделители вместо обведённых карточек,
меньше рамок и теней, упор на типографику и табличные цифры.

## Токены

Объявлены в `src/index.css` (`:root` и `.dark`) и проброшены в Tailwind через `@theme inline`.

| Группа | Переменные | Назначение |
| --- | --- | --- |
| Поверхности | `--pk-bg` `--pk-surface` `--pk-raised` | фон, панель, приподнятый слой |
| Текст | `--pk-fg` `--pk-muted` `--pk-faint` | основной, вторичный, третичный |
| Линии | `--pk-line` `--pk-line-strong` | волосяные разделители |
| Акцент | `--pk-accent` `--pk-accent-fg` `--pk-accent-weak` | единственный акцент (синий) |
| Статусы | `--pk-ok` `--pk-warn` `--pk-bad` | только для реальных состояний |
| Данные | `--pk-c1..c4` | цвета графиков (c1 = акцент, c2/c3 — серые, c4 — вариант акцента) |
| Прочее | `--pk-radius` (7px) `--pk-ring` | радиус, кольцо фокуса |

Tailwind-утилиты: `bg-bg`, `bg-surface`, `bg-raised`, `text-fg`, `text-muted`, `border-line`,
`text-accent`/`bg-accent`, `text-ok/warn/bad`, `rounded-[var(--radius-pk)]`, `.tnum`
(табличные цифры).

Тема переключается классом `.dark` на `<html>` (`@custom-variant dark`), оба режима поддержаны.

## Примитивы (`primitives.tsx`)

`Button` (solid/outline/ghost/danger/link, sm/md/lg, `asChild`), `IconButton`, `Input`,
`Textarea`, `Field` (label + hint), `Kbd`, `Chip` (neutral/accent/ok/warn/bad),
`StatusDot` (online/warning/offline), `Divider`, `Spinner`, `UsageBar` (meter с порогами warn/danger).

## Раскладка (`layout.tsx`)

`Panel` (поверхность, `flush`), `SectionHeader` (h1/h2/h3 + actions), `PageHeader`,
`Stat` (KPI: label → value → delta → note → sparkline), `KpiStrip` (2×2 на телефоне,
4 в ряд с волосяными разделителями на десктопе), `EmptyState`, `InfoRow` (строки «ключ — значение»
с пунктиром), `NoticeBar` (плоская замена алерту, neutral/accent/warn).

## Overlay (`overlay.tsx`)

`Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogBody`/`DialogTitleText`/`DialogClose`,
`ConfirmDialog` (с опциональным вводом подтверждающего текста), `Sheet` (left/right/bottom),
`TooltipProvider`/`Tooltip`, `Menu`/`MenuItem`/`MenuLabel`/`MenuSeparator`/`MenuRadioGroup`/`MenuRadioItem`.

## Контролы (`controls.tsx`)

`Select`/`SelectItem`, `Switch`, `Tabs`/`TabsList`/`TabsTab`/`TabsPanel`, `Segmented` (ToggleGroup).

## Таблицы (`table.tsx`)

`Table`/`THead`/`TBody`/`TR`/`TH`/`TD`, `SortHeader` и главный блок **`DataList<T>`**:
по одной конфигурации `Column<T>` рисует настоящую `<table>` на `md+` и
превращается в стопку карточек-строк на мобильном. Поля колонки: `primary` (заголовок карточки),
`meta` (подпись), `hideBelow` (`sm`/`lg`), `tableOnly`, `sortable`, `align`.

## Данные / графики (`viz.tsx`)

`Sparkline`, `ChartFrame` (заголовок-вывод + переключатель график ↔ таблица + источник),
`VizTable`, `TimeLine` (мультилиния, метки значений на концах, нулевая база, без анимации),
`Bars` (от нуля, порог → цвет аварии), `IoArea` (стек-область чтение/запись).
Соблюдает канон dataviz: ru-RU числа, нулевые базы, ≤4 цветов, прямые подписи, chart↔table.

## Спец-блоки (`special.tsx`)

`Terminal` (самодостаточный мок-терминал: история ↑/↓, автодополнение Tab, быстрые команды,
мобильный ввод), `ScreenTile` (миниатюра экрана с LIVE-бейджем, снимок/фуллскрин).

## Композитные блоки

Собираются из примитивов прямо на страницах: `KpiStrip` + `Stat`, строка/карточка машины
(`DataList`), список оповещений, таблица процессов, блок диска (`UsageBar` + `InfoRow`),
блок терминала, сетка экранов, группа настроек (`Panel` + `Tabs`), шапка страницы,
оболочка приложения (`components/app/shell.tsx`).

## Живой гайд

Маршрут **`/kit`** (`src/pages/Kit.tsx`) показывает все токены, примитивы и блоки.

## Адаптивность

Брейкпоинты 360/390 · 768 · 1024 · 1440+. На мобильном: нижняя навигация + выезжающее
меню (Sheet), таблицы → карточки-строки, KPI 2×2, сетка экранов 1/2/3/4 колонки,
тач-цели ≥44px, без горизонтального скролла.

## Использование

```tsx
import { Button, Stat, KpiStrip, DataList, ChartFrame, TimeLine, toast } from '@/kit'
```

Единая точка входа — barrel `src/kit/index.ts`.
