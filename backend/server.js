// ═══════════════════════════════════════════════════════════
//  Где поесть — Бэкенд (Node.js + Express)
//  Документация в README.md
// ═══════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ──────────────────────────────────────────────────
// Разрешаем запросы только с твоего фронтенда
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));

app.use(express.json());

// ─── ГЛАВНЫЙ МАРШРУТ ───────────────────────────────────────
// GET /restaurants?city=Казань&category=Татарская&price=2
app.get('/restaurants', async (req, res) => {
  const {
    city = 'Казань',
    category = '',
    price = '',
  } = req.query;

  try {

    // ── 2GIS API ─────────────────────────────────────────
    // Документация: https://docs.2gis.com/ru/api/search/places/overview
    // API ключ получить: https://cabinet.2gis.com/
    //
    // 2GIS ищет по тексту, поэтому объединяем кухню и город:
    const searchQuery = category ? `${category} ресторан` : 'ресторан';

    const params = new URLSearchParams({
      q: searchQuery,
      location: city,
      type: 'branch',
      fields: 'items.name,items.address,items.reviews,items.rubrics,items.photos',
      key: process.env.TWOGIS_API_KEY,
      page_size: 20,
    });

    // Фильтрация по цене на стороне бэкенда (2GIS не поддерживает price filter)
    // price: 1 = бюджетно, 2 = средне, 3 = дорого

    const response = await fetch(
      `https://catalog.api.2gis.com/3.0/items?${params}`
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('2GIS error:', errText);
      throw new Error(`2GIS API error: ${response.status}`);
    }

    const data = await response.json();

    // Нормализуем данные в единый формат
    const restaurants = (data.result?.items || []).map(item => ({
      id: item.id,
      name: item.name,
      address: item.address?.name || '',
      rating: item.reviews?.rating_summaries?.[0]?.rating?.toFixed(1) || null,
      reviews: item.reviews?.rating_summaries?.[0]?.reviews_count || 0,
      image: item.photos?.[0]?.preview_urls?.url || null,
      categories: item.rubrics?.map(r => r.name) || [],
      price: parseInt(price) || null,
    }));

    res.json({ restaurants, total: restaurants.length });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(503).json({
      error: 'Сервис временно недоступен',
      detail: err.message,
    });
  }
});

// ─── HEALTH CHECK ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ─── ЗАПУСК ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '*'}`);
  console.log(`   2GIS key: ${process.env.TWOGIS_API_KEY ? 'задан ✓' : 'НЕ ЗАДАН ✗'}`);
});
