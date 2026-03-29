# AqbobekHub Demo

Next.js demo-платформа школы с ролями ученика, учителя, родителя и администрации.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Demo Login

- `student1 / 12345`
- `student2 / 12345`
- `student3 / 12345`
- `teacher1 / 12345`
- `admin / 12345`
- `parent1 / 12345`
- `parent2 / 12345`
- `parent3 / 12345`

## Mock BilimClass API

Для защиты добавлен реалистичный mock BilimClass API.

Что он умеет:

- отдаёт живые demo-данные из локальной базы;
- показывает несколько учеников, классов и предметов;
- покрывает сценарии `сильный ученик`, `рисковый ученик`, `пропуски`, `падение оценок`;
- быстро работает локально без внешних зависимостей;
- подходит как единая точка входа для демонстрации ML-пайплайна.

### Маршруты

- `GET /api/mock/bilimclass`
- `GET /api/mock/bilimclass/students`
- `GET /api/mock/bilimclass/classes`
- `GET /api/mock/bilimclass/students/:studentId`
- `GET /api/mock/bilimclass/students/:studentId/grades`
- `GET /api/mock/bilimclass/students/:studentId/attendance`

## Идеальный demo flow

1. Backend получает оценки и посещаемость из `mock BilimClass API`.
2. Эти данные идут в `Topic Weakness Detector`.
3. Затем слабая тема передаётся в `Personalized Resource Recommender`.
4. Админка отдельно получает план расписания.
5. `Schedule Quality Predictor` оценивает качество расписания.
6. Если есть больничный учителя, `Smart Substitute Teacher Matcher` предлагает замены.

## ML API Routes

- `GET /api/student/topic-weakness`
- `POST /api/student/topic-weakness`
- `GET /api/student/resource-recommendations`
- `POST /api/student/resource-recommendations`
- `GET /api/admin/schedule/quality`
- `POST /api/admin/schedule/quality`
- `GET /api/admin/schedule/substitutes`
- `POST /api/admin/schedule/substitutes`
