# Aqbobek Hub

`Aqbobek Hub` — это демонстрационная школьная платформа с несколькими ролями пользователей, построенная на `Next.js 16`, `React 19`, `TypeScript`, `Prisma 7` и `SQLite`.

Проект показывает не только интерфейс, но и реальную серверную связку:

- кабинеты `ученика`, `учителя`, `родителя`, `администратора`
- отдельный экран `киоска`
- недельное расписание `Smart Schedule`
- авто-перестройку расписания при больничном учителя
- домашние задания с загрузкой решения
- новости, рейтинг, настройки, AI-наставника
- работу с заявками, инцидентами, рассылками и журналом событий

## Содержание

- [1. Что это за проект](#1-что-это-за-проект)
- [2. Технологии](#2-технологии)
- [3. Основные роли и функции](#3-основные-роли-и-функции)
- [4. Smart Schedule](#4-smart-schedule)
- [5. Страницы приложения](#5-страницы-приложения)
- [6. API](#6-api)
- [7. Структура проекта](#7-структура-проекта)
- [8. Пошаговый запуск](#8-пошаговый-запуск)
- [9. Демо-аккаунты](#9-демо-аккаунты)
- [10. Что создаёт seed-скрипт](#10-что-создаёт-seed-скрипт)
- [11. Как быстро проверить, что всё работает](#11-как-быстро-проверить-что-всё-работает)
- [12. Полезные команды](#12-полезные-команды)
- [13. Известные замечания](#13-известные-замечания)

## 1. Что это за проект

Идея проекта — дать школе единую цифровую платформу, в которой:

- ученик видит оценки, риски, расписание, достижения и домашку
- учитель управляет своей неделей, классами, задачами и больничным
- родитель получает понятную картину по ребёнку без перегруза
- администратор управляет школой через административный кабинет и модуль расписания
- экран киоска показывает важную публичную информацию для школы

Проект ориентирован на демонстрационный и портфолио-формат, но внутри уже есть рабочая серверная логика, а не только моковые карточки.

## 2. Технологии

- `Next.js 16.2.1`
- `React 19.2.4`
- `TypeScript`
- `Prisma 7.6`
- `SQLite` через `better-sqlite3`
- `Tailwind CSS 4`
- `Lucide React`
- `@google/genai` для AI-наставника

## 3. Основные роли и функции

### Ученик

У ученика сейчас есть следующие функции:

- главная страница ученика
- просмотр оценок и динамики по предметам
- просмотр рисков и слабых тем
- персональные рекомендации по материалам
- просмотр новостей
- просмотр лидерборда
- отдельная страница полного недельного расписания
- карточка выбранного урока
- страница профиля
- достижения, бейджи и прогресс
- отдельный раздел домашнего задания
- загрузка файла решения
- сохранение черновика домашки без файла
- запись активности ученика в activity feed
- доступ к AI-наставнику
- изменение настроек профиля и уведомлений
- смена пароля

### Учитель

Учительский кабинет теперь разделён на несколько страниц и включает:

- `Обзор`
- `Расписание`
- `Классы`
- `Workbench`

Что умеет учитель:

- смотреть недельное расписание
- видеть ближайшие уроки
- видеть замены и перестроенные слоты
- видеть список своих классов
- видеть число учеников, риски и пропуски по классам
- видеть задачи учителя
- отмечать выполнение задач
- ставить задачу на мини-тест
- ставить задачу на план поддержки
- ставить задачу на сообщение родителям
- ставить задачу на сообщение классу
- открывать задачу на журнал урока
- открывать задачу на посещаемость
- открывать задачу на домашнее задание
- формировать краткий отчёт
- отправлять себя на больничный
- запускать авто-перестройку недели через больничный
- видеть сообщения администрации

### Родитель

Родительский кабинет сейчас даёт:

- обзор по ребёнку
- успеваемость
- посещаемость
- сигналы внимания
- рекомендации на неделю
- спокойные подсказки для разговора дома
- доступ к новостям
- доступ к настройкам
- доступ к AI-наставнику

### Администратор

У администратора есть:

- командный центр
- статистика по ученикам и учителям
- работа с заявками на согласование
- работа с инцидентами
- центр рассылок
- публикация объявлений
- импорт локальных демо-данных
- доступ к модулю расписания

Что умеет модуль расписания у администратора:

- смотреть опубликованный и черновой недельный план
- смотреть качество расписания
- смотреть замены
- сохранять ограничения
- генерировать черновик расписания
- публиковать план
- запускать перестройку расписания при больничном
- смотреть конфликты
- смотреть активные больничные

### Экран киоска

Экран киоска показывает:

- школьные объявления
- системные карточки
- замены и перестроенные уроки
- актуальные карточки киоска из базы

## 4. Smart Schedule

`Smart Schedule` — это модуль недельного расписания.

### Что он поддерживает

- недельную сетку `Пн-Пт`
- целевую нагрузку `5 уроков в день`
- доступность учителей
- доступность кабинетов
- требования по классам на неделю
- пары
- академические часы
- мероприятия
- ленты `bands`
- контроль конфликтов по:
  - классу
  - учителю
  - кабинету
- режим черновика и публикации
- локальную перестройку при больничном учителя
- встроенные уведомления после изменений

### Главные сущности расписания

- `SchedulePlan`
- `ScheduleSlot`
- `ScheduleConflict`
- `Room`
- `TeacherAvailability`
- `RoomAvailability`
- `ScheduleRequirement`
- `ScheduleBand`
- `ScheduleBandMember`
- `TeacherAbsence`

### Главные файлы расписания

- [lib/smart-schedule.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/smart-schedule.ts)
- [lib/schedule-constants.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-constants.ts)
- [lib/schedule-quality.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-quality.ts)
- [lib/substitute-matcher.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/substitute-matcher.ts)

## 5. Страницы приложения

### Общие страницы

- `/`
- `/login`
- `/news`
- `/leaderboard`
- `/settings`
- `/ai-assistant`
- `/kiosk`

### Страницы ученика

- `/student`
- `/student/schedule`
- `/student/homework`
- `/student/profile`

### Страницы учителя

- `/teacher`
- `/teacher/schedule`
- `/teacher/classes`
- `/teacher/workbench`

### Страницы родителя

- `/parent`

### Страницы администратора

- `/admin`
- `/admin/schedule`

## 6. API

Ниже перечислены основные API-эндпоинты проекта.

### Авторизация и сессия

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/change-password`

### Профиль и настройки

- `GET /api/me`
- `PATCH /api/me`
- `GET /api/me/settings`
- `PATCH /api/me/settings`

### API ученика

- `GET /api/student/dashboard`
- `GET /api/student/profile`
- `POST /api/student/activity`
- `GET /api/student/resource-recommendations`
- `GET /api/student/topic-weakness`
- `POST /api/student/homework/submissions`

### API учителя

- `GET /api/teacher/dashboard`
- `POST /api/teacher/reports`
- `POST /api/teacher/communications`
- `PATCH /api/teacher/tasks/[id]`
- `POST /api/teacher/absences`

### API родителя

- `GET /api/parent/dashboard`

### API администратора

- `GET /api/admin/dashboard`
- `GET /api/admin/broadcasts`
- `POST /api/admin/broadcasts`
- `PATCH /api/admin/approvals/[id]`
- `PATCH /api/admin/incidents/[id]`
- `POST /api/admin/migrate-local`

### API расписания

- `GET /api/admin/schedule`
- `POST /api/admin/schedule/generate`
- `POST /api/admin/schedule/publish`
- `GET /api/admin/schedule/constraints`
- `POST /api/admin/schedule/constraints`
- `POST /api/admin/schedule/absences`
- `GET /api/admin/schedule/quality`
- `GET /api/admin/schedule/substitutes`
- `POST /api/admin/schedule/substitutes`

### Контент и демонстрационные данные

- `GET /api/news`
- `POST /api/news`
- `GET /api/leaderboard`
- `GET /api/kiosk`
- `GET /api/mock/bilimclass`
- `GET /api/mock/bilimclass/classes`
- `GET /api/mock/bilimclass/students`
- `GET /api/mock/bilimclass/students/[studentId]`
- `GET /api/mock/bilimclass/students/[studentId]/grades`
- `GET /api/mock/bilimclass/students/[studentId]/attendance`

## 7. Структура проекта

### Основные app-страницы

- [app/(dashboard)/student/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/page.tsx)
- [app/(dashboard)/student/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/schedule/page.tsx)
- [app/(dashboard)/student/homework/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/homework/page.tsx)
- [app/(dashboard)/student/profile/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/profile/page.tsx)
- [app/(dashboard)/teacher/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/page.tsx)
- [app/(dashboard)/teacher/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/schedule/page.tsx)
- [app/(dashboard)/teacher/classes/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/classes/page.tsx)
- [app/(dashboard)/teacher/workbench/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/workbench/page.tsx)
- [app/(dashboard)/parent/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/parent/page.tsx)
- [app/(dashboard)/admin/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/admin/page.tsx)
- [app/(dashboard)/admin/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/admin/schedule/page.tsx)
- [app/kiosk/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/kiosk/page.tsx)

### Общие UI-компоненты

- [components/DashboardShell.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/components/DashboardShell.tsx)

### Серверная логика и сборка данных

- [lib/server-data.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/server-data.ts)
- [lib/session.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/session.ts)
- [lib/http.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/http.ts)
- [lib/smart-schedule.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/smart-schedule.ts)
- [lib/schedule-quality.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-quality.ts)
- [lib/substitute-matcher.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/substitute-matcher.ts)
- [lib/topic-weakness.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/topic-weakness.ts)
- [lib/resource-recommender.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/resource-recommender.ts)
- [lib/mock-bilimclass.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/mock-bilimclass.ts)

### База данных

- [prisma/schema.prisma](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/schema.prisma)
- [prisma/seed.ts](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/seed.ts)
- [dev.db](/Users/kaliakbar/Desktop/aqbobek-hub/dev.db)

## 8. Пошаговый запуск

Ниже — полная инструкция запуска проекта с нуля.

### Требования

На машине должны быть установлены:

- `Node.js 20+`
- `npm`

Проверить версии:

```bash
node -v
npm -v
```

### Шаг 1. Клонировать проект

```bash
git clone https://github.com/Kaliakbarb/aqbobek-hub-MIT.git
cd aqbobek-hub-MIT
```

Если проект уже открыт локально, просто перейдите в папку:

```bash
cd /Users/kaliakbar/Desktop/aqbobek-hub
```

### Шаг 2. Установить зависимости

```bash
npm install
```

### Шаг 3. Проверить переменные окружения

Проект использует:

- локальную SQLite-базу
- опциональный `GEMINI_API_KEY` для AI-наставника

Если нужен AI-чат, добавьте в `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

Если ключ не задан, остальная платформа продолжит работать, но AI-функции могут быть недоступны.

### Шаг 4. Подготовить базу данных

Для чистого запуска используйте полный reset:

```bash
npx prisma migrate reset --force
npm run db:seed
```

Что делают эти команды:

1. удаляют текущую локальную базу
2. применяют все миграции
3. пересоздают структуру
4. заливают демонстрационные данные

Если база уже есть и нужно только перезалить демонстрационные данные:

```bash
npm run db:seed
```

### Шаг 5. Запустить dev-сервер

```bash
npm run dev
```

После запуска проект будет доступен по адресу:

- [http://localhost:3000](http://localhost:3000)

Экран киоска:

- [http://localhost:3000/kiosk](http://localhost:3000/kiosk)

### Шаг 6. Войти в систему

Откройте:

- [http://localhost:3000/login](http://localhost:3000/login)

И используйте один из демо-логинов из раздела ниже.

### Шаг 7. Проверить Prisma-клиент при изменениях схемы

Если вы меняли `prisma/schema.prisma`, выполните:

```bash
npx prisma generate
```

Если меняли схему и хотите создать новую миграцию:

```bash
npx prisma migrate dev
```

### Шаг 8. Проверить production build

Перед финальной сдачей желательно прогнать:

```bash
npm run lint
npm run build
```

## 9. Демо-аккаунты

Пароль для видимых демо-пользователей:

- `12345`

### Ученики

- `student1`
- `student2`
- `student3`

### Учителя

- `teacher1`
- `teacher2`
- `teacher3`
- `teacher4`
- `teacher5`
- `teacher6`
- `teacher7`
- `teacher8`

### Родители

- `parent1`
- `parent2`
- `parent3`

### Администратор

- `admin`

### Скрытые фоновые ученики

В seed-скрипте дополнительно создаются фоновые ученики для реалистичности:

- по `20` учеников на каждый класс:
  - `10 А`
  - `10 Б`
  - `10 В`

Они нужны для:

- более плотного лидерборда
- реалистичного размера классов
- правдоподобной аналитики

Вход под них не предполагается.

## 10. Что создаёт seed-скрипт

`prisma/seed.ts` поднимает целый демонстрационный мир:

- классы
- предметы
- пользователи всех ролей
- видимые ученики
- скрытые фоновые ученики
- учителя
- родители
- администратора
- user settings
- teaching assignments
- оценки
- посещаемость
- цели учеников
- достижения
- навыки
- activity feed
- risk alerts
- задачи учителей
- задания по домашней работе
- отправленные решения домашней работы
- недельные ограничения расписания
- rooms
- teacher availability
- room availability
- ленты `bands`
- недельные учебные требования
- сгенерированное недельное расписание
- active absences
- записи рейтинга
- student badges
- новости
- рассылки
- approvals
- incidents
- журнал событий
- карточки киоска
- история чата для AI-наставника

## 11. Как быстро проверить, что всё работает

Ниже простой smoke-check.

### Проверка ученика

1. Войти как `student1`
2. Открыть `/student`
3. Проверить `/student/schedule`
4. Проверить `/student/homework`
5. Проверить `/student/profile`
6. Проверить `/leaderboard`
7. Проверить `/news`
8. Проверить `/settings`

Что должно работать:

- загрузка кабинета ученика
- открытие полного расписания
- домашка
- профиль и достижения
- новости
- рейтинг
- настройки

### Проверка учителя

1. Войти как `teacher1`
2. Открыть `/teacher`
3. Открыть `/teacher/schedule`
4. Открыть `/teacher/classes`
5. Открыть `/teacher/workbench`

Что должно работать:

- обзор учителя
- недельное расписание
- список классов
- задачи
- кнопки teacher actions
- больничный

### Проверка родителя

1. Войти как `parent1`
2. Открыть `/parent`
3. Открыть `/news`
4. Открыть `/settings`

### Проверка администратора

1. Войти как `admin`
2. Открыть `/admin`
3. Открыть `/admin/schedule`
4. Проверить отправку рассылки
5. Проверить публикацию объявления
6. Проверить schedule generate / publish

### Финальная проверка через CLI

```bash
npm run lint
npm run build
```

## 12. Полезные команды

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset
```

### Дополнительно

Сгенерировать Prisma client:

```bash
npx prisma generate
```

Открыть Prisma Studio:

```bash
npx prisma studio
```

## 13. Известные замечания

- `AI-наставник` требует `GEMINI_API_KEY`
- push-уведомления сейчас реализованы как встроенные уведомления, а не как browser push
- часть действий учителя пока работает через систему задач, а не через отдельный модуль полноценного журнала урока
- при `npm run build` возможны framework warnings про:
  - несколько lockfile на машине
  - deprecated `middleware` -> `proxy`

Это не ломает работу приложения.
