import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/restaurants', async (req, res) => {
  const { city = 'Казань', category = '', price = '' } = req.query;

  const coords = {
  'Казань': '49.106414,55.796127',
  'Москва': '37.617698,55.755864',
  'Helsinki': '24.938379,60.169857',
  };

  const point = coords[city] || coords['Казань'];
  const searchQuery = category ? `${category} ресторан` : 'ресторан';

  const params = new URLSearchParams({
    q: searchQuery,
    point: point,
    radius: 5000,
    type: 'branch',
    fields: 'items.name,items.address,items.reviews,items.rubrics,items.photos',
    key: process.env.TWOGIS_API_KEY,
    page_size: 20,
  });

  try {
    const response = await fetch(`https://catalog.api.2gis.com/3.0/items?${params}`);
    const data = await response.json();
    console.log('2GIS full response:', JSON.stringify(data));

    console.log('2GIS response code:', data.meta?.code);
    console.log('Items count:', data.result?.items?.length);

    const restaurants = (data.result?.items || []).map(item => ({
      id: item.id,
      name: item.name,
      address: item.address?.name || '',
      rating: item.reviews?.rating_summaries?.[0]?.rating?.toFixed(1) || null,
      reviews: item.reviews?.rating_summaries?.[0]?.reviews_count || 0,
      image: item.photos?.[0]?.preview_urls?.url || null,
      categories: item.rubrics?.map(r => r.name) || [],
    }));

    res.json({ restaurants, total: restaurants.length });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(503).json({ error: 'Сервис недоступен' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`2GIS key: ${process.env.TWOGIS_API_KEY ? 'OK' : 'MISSING'}`);
});