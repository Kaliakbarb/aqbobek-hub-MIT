# Aqbobek Hub

`Aqbobek Hub` — это демонстрационная школьная платформа с несколькими ролями пользователей, построенная на `Next.js 16`, `React 19`, `TypeScript`, `Prisma 7` и `SQLite`, с отдельным AI-чатом на `Gemini` и четырьмя собственными обученными ML-моделями.

Проект показывает не только интерфейс, но и реальную серверную связку:

- кабинеты `ученика`, `учителя`, `родителя`, `администратора`
- отдельный экран `киоска`
- недельное расписание `Smart Schedule`
- авто-перестройку расписания при больничном учителя
- `4` встроенные обученные ML-модели для аналитики и рекомендаций
- домашние задания с загрузкой решения
- новости, рейтинг, настройки, AI-наставника
- работу с заявками, инцидентами, рассылками и журналом событий

## Содержание

- [1. Что это за проект](#1-что-это-за-проект)
- [2. Технологии](#2-технологии)
- [3. AI и обученные ML-модели](#3-ai-и-обученные-ml-модели)
- [4. Основные роли и функции](#4-основные-роли-и-функции)
- [5. Smart Schedule](#5-smart-schedule)
- [6. Страницы приложения](#6-страницы-приложения)
- [7. API](#7-api)
- [8. Структура проекта](#8-структура-проекта)
- [9. Пошаговый запуск](#9-пошаговый-запуск)
- [10. Демо-аккаунты](#10-демо-аккаунты)
- [11. Что создаёт seed-скрипт](#11-что-создаёт-seed-скрипт)
- [12. Как быстро проверить, что всё работает](#12-как-быстро-проверить-что-всё-работает)
- [13. Полезные команды](#13-полезные-команды)
- [14. Известные замечания](#14-известные-замечания)

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
- `Python 3` для локального ML-инференса
- `pandas`, `joblib`, `scikit-learn` для обученных моделей

## 3. AI и обученные ML-модели

В проекте есть две разные AI-части, и это важно разделять:

- `Gemini` используется как разговорный `AI-наставник`
- `4` собственные обученные ML-модели используются для аналитики, прогнозов и рекомендаций внутри платформы

То есть проект не сводится только к Gemini-чату. Чат помогает общаться с системой, а обученные модели считают риск слабой темы, качество расписания, подбор замены и релевантность учебных материалов.

### AI-наставник на Gemini

`AI-наставник` встроен в платформу как отдельный модуль общения с пользователем.

Что он делает:

- отвечает в формате школьного помощника для ученика, родителя, учителя и администратора
- использует `@google/genai`
- работает через `GEMINI_API_KEY`
- получает контекст из реальных данных платформы: оценки, расписание, риски, задачи и общую учебную картину пользователя
- доступен через страницу `/ai-assistant`

Важно:

- `Gemini` в этом проекте не заменяет локальные ML-модели
- без `GEMINI_API_KEY` чат может быть недоступен, но остальные части платформы продолжают работать

### Собственные обученные ML-модели

Все четыре модели обучены внутри проекта и сохранены как локальные артефакты `joblib` вместе с препроцессорами. Node.js-часть платформы вызывает их через Python-скрипты, а результаты возвращаются обратно в интерфейс и API.

#### 1. Topic Weakness Model

Модель для определения слабых тем ученика по конкретному предмету и теме.

Что анализирует:

- класс ученика
- предмет и тему
- сложность темы
- недавние и исторические оценки
- средний балл по предмету
- пропуски по теме
- выполнение заданий
- число попыток по квизам
- тренд улучшения или ухудшения
- близость экзамена
- вовлечённость

Что возвращает:

- `weak_topic_probability`
- `risk_level`: `strong`, `medium`, `weak`
- русскую интерпретацию уровня риска

Где используется:

- кабинет ученика
- `GET /api/student/topic-weakness`
- `POST /api/student/topic-weakness`
- [lib/topic-weakness.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/topic-weakness.ts)
- [topic_weakness_model/predict_topic_weakness.py](/Users/kaliakbar/Desktop/aqbobek-hub/topic_weakness_model/predict_topic_weakness.py)

Как устроена:

- это `classification`-модель
- в обучающем пайплайне сравниваются `LogisticRegression` и `RandomForestClassifier`
- сохраняется лучшая модель и отдельный препроцессор признаков

Практическая польза:

- помогает заранее находить темы, по которым ученик проседает
- делает student dashboard не просто визуальным, а аналитическим

#### 2. Schedule Quality Model

Модель для оценки качества школьного расписания как цельной недельной сетки.

Что анализирует:

- количество классов, учителей и кабинетов
- число конфликтов по кабинетам, учителям и классам
- окна у учителей
- подряд идущие сложные уроки у учеников
- среднюю и максимальную дневную нагрузку
- устойчивость расписания к заменам
- баланс нагрузки по неделе
- перегрузку пятницы и нарушения обеденных окон
- сложность потоков и влияние событий

Что возвращает:

- `overall_quality_score` от `0` до `100`
- `quality_band_label`: `low`, `medium`, `high`
- русскую интерпретацию качества

Где используется:

- административный модуль расписания
- `GET /api/admin/schedule/quality`
- `POST /api/admin/schedule/quality`
- [lib/schedule-quality.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-quality.ts)
- [schedule_quality_model/predict_schedule_quality.py](/Users/kaliakbar/Desktop/aqbobek-hub/schedule_quality_model/predict_schedule_quality.py)

Как устроена:

- это `regression`-модель
- в обучающем пайплайне сравниваются `LinearRegression` и `RandomForestRegressor`
- на выходе числовой score дополнительно переводится в понятный band качества

Практическая польза:

- позволяет администратору не просто генерировать расписание, а проверять его качество до публикации
- добавляет к `Smart Schedule` слой аналитической оценки

#### 3. Substitute Matcher Model

Модель для подбора наиболее подходящей замены учителя при больничном или отсутствии.

Что анализирует:

- контекст урока: предмет, класс, слот, день недели, тип кабинета и сложность потока
- опыт исходного учителя
- специализацию кандидата на замену
- вторичную специализацию
- опыт кандидата
- работал ли кандидат с этим классом или параллелью раньше
- доступность кандидата
- текущую дневную и недельную нагрузку
- число подряд идущих уроков
- расстояние до нужного кабинета
- риск выгорания и степень нарушения текущего расписания

Что возвращает:

- `predicted_substitute_fit_score` от `0` до `1`
- `fit_label`: `low`, `medium`, `high`
- русское объяснение, насколько кандидат подходит

Где используется:

- блок замен в административном расписании
- `GET /api/admin/schedule/substitutes`
- `POST /api/admin/schedule/substitutes`
- [lib/substitute-matcher.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/substitute-matcher.ts)
- [substitute_matcher_model/predict_substitute_match.py](/Users/kaliakbar/Desktop/aqbobek-hub/substitute_matcher_model/predict_substitute_match.py)

Как устроена:

- это `ranking/regression`-модель
- в обучающем пайплайне сравниваются `LinearRegression` и `RandomForestRegressor`
- кандидаты ранжируются по score, после чего возвращается top-N лучших вариантов

Практическая польза:

- ускоряет поиск замены
- снижает хаотичность ручного выбора
- учитывает не только предмет, но и нагрузку, continuity и устойчивость расписания

#### 4. Resource Recommender Model

Модель для персональной рекомендации учебных материалов ученику.

Что анализирует:

- слабую тему ученика
- вероятность слабой темы
- уровень освоения темы
- язык предпочтения
- предпочитаемый тип контента
- близость экзамена
- вовлечённость
- доступное время на обучение
- характеристики ресурса: предмет, тема, сложность, длительность, язык, качество, популярность и интерактивность

Что возвращает:

- список наиболее релевантных материалов
- `predicted_relevance_score`
- русскую метку релевантности

Где используется:

- student dashboard
- `GET /api/student/resource-recommendations`
- `POST /api/student/resource-recommendations`
- [lib/resource-recommender.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/resource-recommender.ts)
- [Resource recommender/recommend_resources.py](</Users/kaliakbar/Desktop/aqbobek-hub/Resource recommender/recommend_resources.py>)

Как устроена:

- это `regression/ranking`-модель
- она ранжирует каталог ресурсов под конкретный контекст ученика
- в обучающем пайплайне сравниваются `LinearRegression` и `RandomForestRegressor`

Практическая польза:

- превращает блок рекомендаций в персонализированный модуль, а не в статичный список ссылок
- связывает аналитику слабых тем с дальнейшим учебным действием

### Как AI и ML связаны между собой

Связка в проекте выглядит так:

- `Gemini` отвечает за диалоговый интерфейс
- `topic weakness model` находит слабые темы ученика
- `resource recommender` предлагает подходящие материалы под найденную слабую тему
- `schedule quality model` оценивает качество недельного расписания
- `substitute matcher model` помогает находить лучшую замену учителя

Именно поэтому проект можно позиционировать как школьную платформу не только с интерфейсом и чатом, но и с собственной прикладной ML-логикой.

## 4. Основные роли и функции

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

## 5. Smart Schedule

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

## 6. Страницы приложения

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

## 7. API

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

### API AI-наставника

- `POST /api/ai-assistant`
- `GET /api/ai-assistant/history`
- `DELETE /api/ai-assistant/history`

### API ученика

- `GET /api/student/dashboard`
- `GET /api/student/profile`
- `POST /api/student/activity`
- `GET /api/student/resource-recommendations`
- `POST /api/student/resource-recommendations`
- `GET /api/student/topic-weakness`
- `POST /api/student/topic-weakness`
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

## 8. Структура проекта

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

### AI и ML-модули

- [app/(dashboard)/ai-assistant/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/ai-assistant/page.tsx)
- [app/api/ai-assistant/route.ts](/Users/kaliakbar/Desktop/aqbobek-hub/app/api/ai-assistant/route.ts)
- [topic_weakness_model/predict_topic_weakness.py](/Users/kaliakbar/Desktop/aqbobek-hub/topic_weakness_model/predict_topic_weakness.py)
- [schedule_quality_model/predict_schedule_quality.py](/Users/kaliakbar/Desktop/aqbobek-hub/schedule_quality_model/predict_schedule_quality.py)
- [substitute_matcher_model/predict_substitute_match.py](/Users/kaliakbar/Desktop/aqbobek-hub/substitute_matcher_model/predict_substitute_match.py)
- [Resource recommender/recommend_resources.py](</Users/kaliakbar/Desktop/aqbobek-hub/Resource recommender/recommend_resources.py>)

### База данных

- [prisma/schema.prisma](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/schema.prisma)
- [prisma/seed.ts](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/seed.ts)
- [dev.db](/Users/kaliakbar/Desktop/aqbobek-hub/dev.db)

## 9. Пошаговый запуск

Ниже — полная инструкция запуска проекта с нуля.

### Требования

На машине должны быть установлены:

- `Node.js 20+`
- `npm`
- `python3` для локальных ML-моделей

Проверить версии:

```bash
node -v
npm -v
python3 --version
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

Для локального запуска обученных ML-моделей также желательно установить Python-зависимости:

```bash
python3 -m pip install pandas scikit-learn joblib
```

### Шаг 3. Проверить переменные окружения

Проект использует:

- локальную SQLite-базу
- опциональный `GEMINI_API_KEY` только для AI-наставника на `Gemini`

Если нужен AI-чат, добавьте в `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

Если ключ не задан, чат с `Gemini` будет недоступен, но остальные функции платформы и локальные ML-модели смогут работать отдельно.

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

## 10. Демо-аккаунты

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

## 11. Что создаёт seed-скрипт

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

Дополнительно проект использует локальные ML-артефакты:

- `topic_weakness_model.joblib`
- `schedule_quality_model.joblib`
- `substitute_matcher_model.joblib`
- `resource_recommender_model.joblib`

## 12. Как быстро проверить, что всё работает

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

## 13. Полезные команды

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

## 14. Известные замечания

- `AI-наставник` на `Gemini` требует `GEMINI_API_KEY`
- локальные ML-модели вызываются через `python3`; если Python-инференс недоступен, часть сценариев использует fallback-логику на TypeScript-стороне
- push-уведомления сейчас реализованы как встроенные уведомления, а не как browser push
- часть действий учителя пока работает через систему задач, а не через отдельный модуль полноценного журнала урока
- при `npm run build` возможны framework warnings про:
  - несколько lockfile на машине
  - deprecated `middleware` -> `proxy`

Это не ломает работу приложения.
