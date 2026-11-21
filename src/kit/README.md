# Panel kit

Собственная дизайн-система проекта «Пульт». Заменяет дефолтную библиотеку shadcn/ui как
основной визуальный слой: токены, примитивы и блоки — наши. Под капотом используются
headless-примитивы `radix-ui` (Dialog, Tooltip, Select, Switch, Tabs, DropdownMenu,
ToggleGroup, Slot) — только для доступности и поведения; весь внешний вид, API и токены
определяются здесь.

Философия: **документальная раскладка** (по мотивам постановки блоков в docs-сайтах уровня
Claude Docs, без чужого кода и ассетов): шапка в два ряда (поиск ⌘K, тенант, тема + вкладки
разделов), левое меню групп, центральная колонка с крошками, serif-заголовком, лидом и
секциями, справа «На странице» на длинных экранах. Тёмный **primary** (`#18181b`, в тёмной
теме инвертирован), акцент — только для данных и индикаторов, статусные цвета — только для
реальных состояний.

Шрифты (npm `@fontsource*`, без внешних CDN): Inter — интерфейс, Literata Variable — заголовки
(`.pk-display`), JetBrains Mono Variable — код и терминал.

## Токены

Объявлены в `src/index.css` (`:root` и `.dark`) и проброшены в Tailwind через `@theme inline`.

| Группа | Переменные | Назначение |
| --- | --- | --- |
| Поверхности | `--pk-bg` `--pk-surface` `--pk-raised` | фон, панель, приподнятый слой |
| Текст | `--pk-fg` `--pk-muted` `--pk-faint` | основной, вторичный, третичный |
| Линии | `--pk-line` `--pk-line-strong` | волосяные разделители |
| Primary | `--pk-primary` `--pk-primary-fg` | кнопки, активные вкладки, переключатели, логотип: `#18181b` / в dark `#f4f4f5` |
| Акцент | `--pk-accent` `--pk-accent-fg` `--pk-accent-weak` | синий — только данные и индикаторы |
| Статусы | `--pk-ok` `--pk-warn` `--pk-bad` | только для реальных состояний |
| Данные | `--pk-c1..c4` | цвета графиков (c1 = акцент, c2/c3 — цветные, без серых столбцов в dark, c4 — вариант акцента) |
| Прочее | `--pk-radius` (8px, контролы) `--pk-radius-lg` (12px, карточки) `--pk-ring` `--pk-header-h` | радиусы, кольцо фокуса, высота шапки |

Tailwind-утилиты: `bg-bg`, `bg-surface`, `bg-raised`, `text-fg`, `text-muted`, `border-line`,
`bg-primary`/`text-primary-fg`, `text-accent`/`bg-accent`, `text-ok/warn/bad`, `.pk-tactile` (подъём на hover только у hover-устройств, нажатие scale .992, всё под `prefers-reduced-motion: no-preference`), `rounded-[var(--radius-pk)]`, `.tnum`
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
с пунктиром), `NoticeBar` (совместимость: рендерит `Callout`).

## Docs-блоки (`docs.tsx`)

`Breadcrumbs`, `Callout` (note/info/tip/warn/danger), `Section` (serif H2 + кнопка-якорь), `Toc`
(«На странице» со scroll-spy), `DocPage` (центр + липкая правая колонка TOC на xl), `CardGrid`/`Card`
(карточки-ссылки со стрелкой), `CodeBlock` (заголовок или вкладки, копирование, свои действия —
например «В терминал»), `CopyButton`, `Steps`/`Step` (todo/current/done), `PrevNext`.

## Overlay (`overlay.tsx`)

`Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogBody`/`DialogTitleText`/`DialogClose`,
`ConfirmDialog` (с опциональным вводом подтверждающего текста; `trigger` или управляемый режим `open`/`onOpenChange` — например, подтверждение при выключении переключателя), `Sheet` (left/right/bottom),
`TooltipProvider`/`Tooltip`, `Menu`/`MenuItem`/`MenuLabel`/`MenuSeparator`/`MenuRadioGroup`/`MenuRadioItem`.

## Контролы (`controls.tsx`)

`Select`/`SelectItem` (длинное значение обрезается многоточием, триггер не распирает сетку), `Switch`,
`Tabs`/`TabsList`/`TabsTab`/`TabsPanel` (список вкладок прокручивается по горизонтали и держит активную
вкладку в зоне видимости; на мобильном вкладка 44 px высотой), `Segmented` (ToggleGroup; для 3+ длинных
вариантов на узком экране заменяйте на `Select`).

## Таблицы (`table.tsx`)

`Table`/`THead`/`TBody`/`TR`/`TH`/`TD`, `SortHeader` и главный блок **`DataList<T>`**:
по одной конфигурации `Column<T>` рисует настоящую `<table>` на `md+` и
превращается в стопку карточек-строк на мобильном. Поля колонки: `primary` (заголовок карточки),
`meta` (подпись), `hideBelow` (`sm`/`lg`), `tableOnly`, `wide` (на всю ширину карточки — для длинного
текста и контролов), `sortable`, `align`.

## Данные / графики (`viz.tsx`)

`Sparkline`, `ChartFrame` (заголовок-вывод + переключатель график ↔ таблица + источник),
`VizTable`, `TimeLine` (мультилиния, метки значений на концах, нулевая база, без анимации),
`Bars` (от нуля, порог → цвет аварии), `IoArea` (стек-область чтение/запись).
Соблюдает канон dataviz: ru-RU числа, нулевые базы, ≤4 цветов, прямые подписи, chart↔table.

## Спец-блоки (`special.tsx`)

`Terminal` (самодостаточный мок-терминал: история ↑/↓, автодополнение Tab, быстрые команды,
мобильный ввод, копирование вывода, очистка, `inject` — вставка команды извне), `ScreenTile` (миниатюра экрана с временем кадра, снимок/фуллскрин).

## Композитные блоки

Собираются из примитивов прямо на страницах: `KpiStrip` + `Stat`, строка/карточка машины
(`DataList`), список оповещений, таблица процессов, блок диска (`UsageBar` + `InfoRow`),
блок терминала, сетка экранов, группы настроек (секции `Section` подряд), шапка страницы,
оболочка приложения (`components/app/shell.tsx`).

Администрирование ПК (`src/pages/admin/*`, вкладки карточки машины `?tab=`): службы, ПО и обновления,
сеансы, планировщик, журнал событий, сеть и брандмауэр, питание, файлы, удалённая помощь. Все
разрушительные действия идут через `ConfirmDialog`, критичные — с вводом имени. Схема взаимодействия
(`src/pages/Architecture.tsx`) — SVG-диаграмма на xl и вертикальная стопка карточек ниже, с текстовой
таблицей шагов как альтернативой.

## Живой гайд

Маршрут **`/kit`** (`src/pages/Kit.tsx`) показывает все токены, примитивы и блоки.

## Адаптивность

Брейкпоинты 360/390 · 768 · 1024 · 1440+. На мобильном: второй ряд шапки «Группа › Страница»
открывает выезжающее слева меню (Sheet); нижней навигации нет, таблицы → карточки-строки, KPI 2×2, сетка экранов 1/2/3/4 колонки,
тач-цели ≥44px (`pointer-coarse:` — кнопки, ссылки-кнопки, сегменты, TOC, шаги), без горизонтального скролла.

## Использование

```tsx
import { Button, Stat, KpiStrip, DataList, ChartFrame, TimeLine, toast } from '@/kit'
```

Единая точка входа — barrel `src/kit/index.ts`.
