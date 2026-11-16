/* Interaction-diagram model for the «Схема взаимодействия» page. Pure data — the page renders it. */
export type NodeId = 'browser' | 'gateway' | 'audit' | 'broker' | 'agent' | 'telemetry' | 'notify'
export type ArchNode = { id: NodeId; title: string; sub: string; role: string; parts: string[]; security: string }
export type ArchEdge = { id: string; a: NodeId; b: NodeId; proto: string; note: string; bend?: number; lt?: number }
export type Step = { from: NodeId; to: NodeId; proto: string; text: string }
export type ScenarioId = 'pwsh' | 'screen' | 'kill'

export const nodes: ArchNode[] = [
  { id: 'browser', title: 'Браузер оператора', sub: 'Панель «Пульт»', role: 'SPA: дашборды, терминал, просмотр экрана. Держит WebSocket для живых данных.',
    parts: ['React-панель', 'WebSocket-клиент', 'Подтверждение опасных действий'], security: 'Вход через SSO (OIDC), короткоживущий токен, без хранения секретов в браузере.' },
  { id: 'gateway', title: 'API-шлюз', sub: 'SSO · RBAC · аудит', role: 'Единая точка входа: аутентификация, проверка ролей и политик, rate-limit, запись аудита.',
    parts: ['OIDC/SAML SSO', 'RBAC и политики арендатора', 'Step-up для опасных команд', 'Хук аудита'], security: 'TLS 1.3, проверка прав на каждый запрос, разделение арендаторов.' },
  { id: 'audit', title: 'Журнал аудита', sub: 'append-only', role: 'Неизменяемый журнал: кто, что, на какой машине, с каким результатом.',
    parts: ['WORM-хранилище', 'Хэш-цепочка записей', 'Экспорт в SIEM'], security: 'Только добавление; удаление записей невозможно даже администратору.' },
  { id: 'broker', title: 'Брокер команд', sub: 'очередь заданий', role: 'Принимает подписанные задания, раздаёт агентам, собирает результаты; переживает обрывы связи.',
    parts: ['Очередь с TTL', 'Подпись заданий', 'Повтор и дедупликация'], security: 'Агенты подключаются сами (исходящие соединения) — входящие порты на ПК не нужны.' },
  { id: 'agent', title: 'Агент на ПК/сервере', sub: 'служба Windows', role: 'Служба PultAgent под LocalSystem: выполняет задания и собирает телеметрию.',
    parts: ['PowerShell-раннер (JEA)', 'Захват экрана (DXGI)', 'Сборщики процессов и дисков', 'Сборщик журналов событий'], security: 'mTLS с сертификатом машины, constrained language, проверка подписи каждого задания.' },
  { id: 'telemetry', title: 'Хранилище телеметрии', sub: 'метрики и события', role: 'Временные ряды CPU/ОЗУ/дисков, инвентарь, события; источник дашбордов и правил.',
    parts: ['TSDB метрик', 'Инвентарь ПО и служб', 'Движок правил оповещений'], security: 'Шифрование на диске, ретеншн по арендатору.' },
  { id: 'notify', title: 'Уведомления', sub: 'push · e-mail · чат', role: 'Доставляет оповещения дежурным и в панель.',
    parts: ['WebSocket push в панель', 'E-mail / мессенджер', 'Эскалация по расписанию'], security: 'Без содержимого команд — только факт события и ссылка в панель.' },
]

export const edges: ArchEdge[] = [
  { id: 'browser-gateway', a: 'browser', b: 'gateway', proto: 'HTTPS · WSS', note: 'REST-запросы и WebSocket с живыми данными' },
  { id: 'gateway-audit', a: 'gateway', b: 'audit', proto: 'gRPC', note: 'запись каждого действия' },
  { id: 'gateway-broker', a: 'gateway', b: 'broker', proto: 'gRPC', note: 'постановка подписанных заданий' },
  { id: 'broker-agent', a: 'broker', b: 'agent', proto: 'mTLS · WSS', note: 'исходящее соединение агента' },
  { id: 'agent-telemetry', a: 'agent', b: 'telemetry', proto: 'gRPC · метрики', note: 'метрики раз в 2 с, события' },
  { id: 'gateway-telemetry', a: 'gateway', b: 'telemetry', proto: 'gRPC · запросы', note: 'чтение дашбордов', bend: -0.06 },
  { id: 'telemetry-notify', a: 'telemetry', b: 'notify', proto: 'события', note: 'сработавшие правила оповещений' },
  { id: 'notify-browser', a: 'notify', b: 'browser', proto: 'WSS push', note: 'оповещения в панель (WebSocket)', bend: 0.1, lt: 0.28 },
]

export const edgeBetween = (x: NodeId, y: NodeId) => edges.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x))

export const scenarios: Record<ScenarioId, { label: string; steps: Step[] }> = {
  pwsh: { label: 'Выполнить PowerShell', steps: [
    { from: 'browser', to: 'gateway', proto: 'HTTPS', text: 'Оператор отправляет команду Get-Service с токеном SSO.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'RBAC: роль «Оператор» может запускать PowerShell. Аудит: «команда запрошена».' },
    { from: 'gateway', to: 'broker', proto: 'gRPC', text: 'Задание подписывается и ставится в очередь с TTL 60 с.' },
    { from: 'broker', to: 'agent', proto: 'mTLS', text: 'Агент получает задание по своему исходящему соединению и проверяет подпись.' },
    { from: 'agent', to: 'broker', proto: 'mTLS', text: 'PowerShell-раннер (JEA) выполняет команду и стримит stdout.' },
    { from: 'broker', to: 'gateway', proto: 'gRPC', text: 'Брокер передаёт вывод и код выхода шлюзу.' },
    { from: 'gateway', to: 'browser', proto: 'WebSocket', text: 'Вывод построчно появляется в веб-терминале.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'Аудит: код выхода 0, хэш вывода, длительность.' },
  ] },
  screen: { label: 'Снимок экрана', steps: [
    { from: 'browser', to: 'gateway', proto: 'HTTPS', text: 'Запрос снимка экрана выбранной машины.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'RBAC «Просмотр экрана» и политика согласия пользователя. Аудит: «просмотр запрошен».' },
    { from: 'gateway', to: 'broker', proto: 'gRPC', text: 'Задание capture ставится в очередь.' },
    { from: 'broker', to: 'agent', proto: 'mTLS', text: 'Агент получает задание; пользователь видит значок «экран просматривается».' },
    { from: 'agent', to: 'broker', proto: 'mTLS', text: 'Модуль захвата (DXGI) снимает кадр, ставит водяной знак оператора, сжимает в JPEG.' },
    { from: 'broker', to: 'gateway', proto: 'gRPC', text: 'Кадр передаётся шлюзу без сохранения на брокере.' },
    { from: 'gateway', to: 'browser', proto: 'WebSocket', text: 'Снимок показывается в плитке и доступен для сохранения.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'Аудит: факт просмотра, время, оператор.' },
  ] },
  kill: { label: 'Завершить процесс', steps: [
    { from: 'browser', to: 'gateway', proto: 'HTTPS', text: 'После подтверждения в диалоге панель отправляет Stop-Process для PID.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'RBAC «Администратор» + step-up подтверждение. Аудит: «намерение завершить процесс».' },
    { from: 'gateway', to: 'broker', proto: 'gRPC', text: 'Подписанное задание с PID и именем процесса (защита от подмены PID).' },
    { from: 'broker', to: 'agent', proto: 'mTLS', text: 'Агент сверяет PID и имя, завершает процесс.' },
    { from: 'agent', to: 'telemetry', proto: 'gRPC', text: 'Сборщик процессов фиксирует исчезновение PID.' },
    { from: 'agent', to: 'broker', proto: 'mTLS', text: 'Результат Stop-Process возвращается брокеру.' },
    { from: 'broker', to: 'gateway', proto: 'gRPC', text: 'Шлюз получает результат и обновляет таблицу процессов.' },
    { from: 'telemetry', to: 'notify', proto: 'события', text: 'Правило «остановлен процесс из списка наблюдения» срабатывает.' },
    { from: 'notify', to: 'browser', proto: 'WebSocket', text: 'Дежурный получает push в панели и письмо.' },
    { from: 'gateway', to: 'audit', proto: 'gRPC', text: 'Аудит: итог операции и подтверждение оператора.' },
  ] },
}
