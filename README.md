# Где поесть 🍽️

Веб-приложение для поиска ресторанов по городу, кухне и настроению.
Данные берутся из **2GIS Places API** (отлично работает в России).

---

## Структура проекта

```
gde-poest/
├── frontend/
│   └── index.html          ← весь фронтенд (HTML + CSS + JS в одном файле)
├── backend/
│   ├── server.js           ← Node.js сервер (Express)
│   ├── package.json        ← зависимости бэкенда
│   └── .env.example        ← шаблон переменных окружения
├── vercel.json             ← конфиг для деплоя фронта на Vercel
└── README.md               ← этот файл
```

---

## Как это работает

```
Браузер (index.html)
    │
    │  GET /restaurants?city=Казань&category=Татарская&price=2
    ▼
Бэкенд (server.js на Render)
    │  добавляет API-ключ 2GIS (ключ скрыт от пользователя!)
    │
    │  GET https://catalog.api.2gis.com/3.0/items?q=Татарская+ресторан&...
    ▼
2GIS Places API
    │  возвращает список мест
    ▼
Бэкенд обрабатывает → отдаёт фронтенду чистый JSON
```

**Почему нельзя вызывать 2GIS напрямую из браузера?**
Потому что тогда API-ключ будет виден в исходном коде страницы.
Бэкенд — это посредник, который прячет ключ.

---

## Шаг 1. Получить API ключ 2GIS

1. Зайди на https://cabinet.2gis.com/
2. Зарегистрируйся / войди
3. Создай новое приложение → выбери **Places API**
4. Скопируй ключ — он нужен на следующем шаге

Бесплатный тариф: **500 запросов/сутки** — достаточно для разработки и демо.

---

## Шаг 2. Запустить локально

### Бэкенд

```bash
cd backend
cp .env.example .env
```

Открой `.env` и вставь ключ:

```
TWOGIS_API_KEY=вставь_свой_ключ_сюда
FRONTEND_URL=http://localhost:5500
PORT=3001
```

Затем:

```bash
npm install
npm run dev      # или npm start
```

Сервер запустится на http://localhost:3001

Проверь что работает: http://localhost:3001/health
Должен вернуть: `{"status":"ok"}`

### Фронтенд

Открой `frontend/index.html` через Live Server в VS Code
(или любой локальный сервер на порту 5500).

**Важно:** открывать через сервер, не двойным кликом на файл —
иначе CORS заблокирует запросы к бэкенду.

### Подключить фронт к бэкенду

В файле `frontend/index.html` найди строку:

```js
const API_BASE = 'https://your-backend.onrender.com';
```

Замени на:

```js
const API_BASE = 'http://localhost:3001';
```

Затем раскомментируй блок с реальным fetch-запросом (там есть комментарий)
и закомментируй или удали блок с MOCK данными.

---

## Шаг 3. Задеплоить

### Бэкенд → Render (бесплатно)

1. Зайди на https://render.com, создай аккаунт
2. New → **Web Service**
3. Подключи GitHub репозиторий с проектом
4. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Runtime:** Node
5. В разделе **Environment Variables** добавь:
   - `TWOGIS_API_KEY` = твой ключ
   - `FRONTEND_URL` = https://gde-poest.vercel.app (пока не знаешь — ставь `*`)
6. Deploy → подожди 2–3 минуты
7. Скопируй URL вида `https://gde-poest-abc123.onrender.com`

### Фронтенд → Vercel (бесплатно)

1. Зайди на https://vercel.com, создай аккаунт
2. Import Git Repository → выбери свой репо
3. Vercel сам найдёт `vercel.json` и всё настроит
4. После деплоя — скопируй URL вида `https://gde-poest.vercel.app`

### Финальная связка

1. Вернись в Render → Environment Variables
2. Обнови `FRONTEND_URL` = https://gde-poest.vercel.app
3. В `frontend/index.html` обнови:
   ```js
   const API_BASE = 'https://gde-poest-abc123.onrender.com';
   ```
4. Запушь в GitHub → Vercel задеплоит автоматически

---

## Функциональность

| Фича | Где реализовано |
|------|----------------|
| Поиск по городу | `frontend/index.html` → `doSearch()` → `backend/server.js` |
| Фильтр по кухне | `select#category` → параметр `category` в запросе |
| Фильтр по цене | `select#price` → фильтрация на бэкенде |
| Настроение (быстро/новое/вечер) | фильтрация на фронте по полю `mood` |
| Случайный ресторан | `pickRandom()` → берёт случайный из `currentData` |
| Избранное | `localStorage` → `toggleFav()` |
| Обработка ошибок | `try/catch` + баннер `#error-banner` |
| Адаптивность | CSS `@media (max-width: 600px)` |

---

## Переключение с MOCK на реальный API

В `frontend/index.html` в функции `doSearch()`:

**Сейчас (MOCK):**
```js
// МОКА (удали когда подключишь API):
await new Promise(r => setTimeout(r, 500));
let data = [...MOCK];
// ... фильтрация ...
currentData = data;
```

**После подключения бэкенда (раскомментировать):**
```js
const params = new URLSearchParams({ city, category, price }).toString();
const res = await fetch(`${API_BASE}/restaurants?${params}`);
if (!res.ok) throw new Error('API error');
const data = await res.json();
currentData = data.restaurants;
```

---

## Частые проблемы

**CORS ошибка в консоли браузера**
→ Убедись что `FRONTEND_URL` в `.env` совпадает с адресом фронтенда
→ Или временно поставь `FRONTEND_URL=*` чтобы разрешить всё

**2GIS вернул пустой массив**
→ Проверь что API ключ правильный
→ Попробуй запрос вручную: http://localhost:3001/restaurants?city=Казань

**Render засыпает через 15 минут** (бесплатный план)
→ Первый запрос после сна займёт ~10 секунд — это нормально
→ Для продакшна перейди на платный план или используй Railway

**Фронт открывается но запросы не идут**
→ Открывай через Live Server, не двойным кликом на .html файл

---

## Дальнейшие улучшения

- [ ] Карта с метками (Leaflet.js + OpenStreetMap, бесплатно)
- [ ] История поиска (localStorage)
- [ ] Страница "Избранное" с сохранёнными ресторанами
- [ ] Детальная страница ресторана с фото
- [ ] Кнопка "Поделиться" — генерировать ссылку с параметрами

---

## Стек

- **Фронтенд:** HTML + CSS + Vanilla JS (без фреймворков)
- **Бэкенд:** Node.js 18+ + Express 4
- **API:** 2GIS Places API v3
- **Деплой:** Vercel (фронт) + Render (бэк)
- **Шрифты:** Unbounded + Golos Text (Google Fonts)
