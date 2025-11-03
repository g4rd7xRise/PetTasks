# PetTasks

Небольшое учебное приложение: клиент на React + Vite (TypeScript, MUI, Monaco), сервер на Express с SQLite (better-sqlite3). Проект включает:
- **Задачи/Алгоритмы** с тестами и прогрессом
- **Аутентификацию** (JWT)
- **Личный прогресс и тудушки**
- **Учебные главы/разделы**
- **Storybook** для UI-компонентов

## Быстрый старт

```bash
# 1) Установка зависимостей
npm install

# 2) Запуск фронтенда + API одновременно (Dev)
npm run start
# Фронтенд: http://localhost:5173  (Vite)
# API:      http://localhost:4000  (Express)

# Альтернативно по отдельности:
# Запуск только API
npm run api
# Запуск только фронтенда
npm run dev
```

По умолчанию Vite проксирует запросы `/api` на `http://localhost:4000` (см. `vite.config.ts`).

## Требования
- Node.js 18+ (рекомендуется LTS)
- npm 9+

## Переменные окружения
Создайте файл `.env` в корне (рядом с `package.json`) при необходимости переопределить значения по умолчанию:

```env
# Порт API (по умолчанию 4000)
PORT=4000

# Секрет для JWT (не храните dev-значение в проде)
JWT_SECRET=change_me

# Путь к файлу базы (по умолчанию ./data.sqlite)
DB_PATH=F:/PetProjects/PetTasks/data.sqlite
```

Загрузка `.env` выполняется в `server/config.js` через `dotenv`. Если `.env` отсутствует — используются дефолты.

## Скрипты npm
- `npm run start` — параллельный запуск API и Vite (dev)
- `npm run api` — только сервер API (`server/index.js`)
- `npm run dev` — только фронтенд (Vite)
- `npm run build` — сборка TypeScript и production-бандла Vite
- `npm run preview` — предпросмотр production-сборки
- `npm run lint` — ESLint
- `npm run storybook` — запуск Storybook на `http://localhost:6006`
- `npm run build-storybook` — сборка Storybook

## Технологии
- Клиент: React 19, TypeScript, Vite 7, MUI, Styled Components, Monaco Editor, React Markdown
- Сервер: Express 5, better-sqlite3, bcryptjs, jsonwebtoken, dotenv, CORS
- Тесты/Design System: Storybook 9, Vitest (+ @storybook/addon-vitest), Playwright (browser provider)
- БД: SQLite (файлы `data.sqlite`, `data.sqlite-shm`, `data.sqlite-wal`)

## Структура проекта

```text
f:/PetProjects/PetTasks/
  server/           # Express API, конфиг, доступ к SQLite
  src/              # Клиент (React + TS)
  public/           # Статика (в т.ч. исходные проблемы)
  index.html        # Корневой HTML для Vite
  vite.config.ts    # Vite + dev proxy на API
  package.json
  data.sqlite*      # Файлы базы (генерируются/используются сервером)
```

Ключевые каталоги клиента (`src/components`):
- `Auth/` — страницы аутентификации и профиль
- `Problems/` — список задач, детальная, редактор кода, прогресс
- `Learning/` — страницы учебных глав/разделов
- `UI/` — базовые элементы и тема

## Обзор API
Базовый URL в dev: `http://localhost:4000`

- **Health**
  - `GET /api/health` → `{ ok: true }`

- **Аутентификация (JWT)**
  - `POST /api/auth/register` `{ name, email, password }` → `{ token, user }`
  - `POST /api/auth/login` `{ email, password }` → `{ token, user }`

- **Публичные задачи**
  - `GET /api/problems` → опубликованные задачи
  - `GET /api/problems/:slug` → детальная задача

- **Прогресс (требует Bearer токен)**
  - `GET /api/progress/:slug`
  - `POST /api/progress/:slug` `{ solved, lastCode }`

- **Ежедневная статистика (требует Bearer токен)**
  - `GET /api/stats/daily?days=14` → массив по дням с `solved/attempted`

- **Тудушки (требует Bearer токен)**
  - `GET /api/todos`
  - `POST /api/todos` `{ text }`
  - `PATCH /api/todos/:id` `{ text?, completed? }`
  - `DELETE /api/todos/:id`

- **Learning (требует Bearer токен)**
  - `GET /api/learning/chapters`
  - `GET /api/learning/chapters/:slug`

- **Админ (требует роль admin)**
  - `GET /api/admin/problems`
  - `POST /api/admin/problems`
  - `PATCH /api/admin/problems/:slug`
  - `DELETE /api/admin/problems/:slug`
  - `GET /api/admin/problems/:slug/tests`
  - `POST /api/admin/problems/:slug/tests`
  - `PATCH /api/admin/tests/:id`
  - `DELETE /api/admin/tests/:id`
  - `POST /api/admin/learning/chapters`
  - `DELETE /api/admin/learning/chapters/:slug`
  - `POST /api/admin/learning/sections`
  - `DELETE /api/admin/learning/sections/:id`
  - `POST /api/admin/learning/cleanup-orphans`
  - `POST /api/admin/learning/assign-parent` `{ slug, parentSlug }`

Примечание: роль пользователя берётся из JWT payload (`role`). В dev по умолчанию создаются пользователи с ролью `user`. Для админ-операций вам потребуется выдать токен с `role: "admin"` или расширить логику создания пользователей.

## Данные и база
- Сервер инициализирует схему при старте (`initSchema()`), хранит данные в SQLite (`data.sqlite`).
- Репозитории (users, progress, todos, problems, tests, learning) инкапсулированы в `server/db.js`.
- В каталоге `public/` может лежать исходный JSON с задачами для первичного наполнения.

## Разработка
- Источники клиента — в `src/`.
- Тема/стили: `src/components/UI/theme.tsx`, глобальные стили — `src/index.css`, `src/App.css`.
- Точка входа: `src/main.tsx`.
- Запросы к API: см. `src/components/UI/api.ts` и использование в страницах.

## Тестирование Storybook
```bash
npm run storybook           # запуск стенда компонентов
npm run build-storybook     # сборка статического стенда
```

## Деплой (общее направление)
- Соберите клиент: `npm run build` (артефакты в `dist/`).
- Поднимите Node.js процесс для API (`node server/index.js`) с корректным `.env`.
- Настройте обратный прокси, чтобы фронтенд и `/api` обслуживались из одного домена.

## Лицензия
MIT

# Contributors

- [Azizakii](https://github.com/Azizakii)

---
Если что-то не работает — проверьте версии Node/npm, переменные окружения и логи старта API/клиента.

