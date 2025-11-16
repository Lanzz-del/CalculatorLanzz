import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getUserApiKeys } from '../utils/supabase.js';
import { RealtimeDataService } from '../services/realtime-data.js';

const router = express.Router();

// Crypto prices
router.get('/crypto/:symbol', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const data = await dataService.getCryptoPrice(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Crypto price error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/crypto', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const data = await dataService.getMultipleCryptoPrices(symbols);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Multiple crypto prices error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/crypto/:symbol/klines', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const { interval = '1h', limit = 100 } = req.query;
    const data = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Crypto klines error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stock prices
router.get('/stock/:symbol', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const data = await dataService.getStockPrice(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Stock price error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['AAPL', 'GOOGL', 'MSFT'];
    const data = await dataService.getMultipleStockPrices(symbols);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Multiple stock prices error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock/:symbol/history', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const { period1, period2 } = req.query;
    const data = await dataService.getStockHistory(
      req.params.symbol,
      period1 ? new Date(period1) : undefined,
      period2 ? new Date(period2) : undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Stock history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// News
router.get('/news', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const { query = 'cryptocurrency', category = 'business' } = req.query;
    const data = await dataService.getNews(query, category);
    res.json({ success: true, data });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Weather
router.get('/weather/:city', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const data = await dataService.getWeather(req.params.city);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Economic data
router.get('/economic/:seriesId', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const data = await dataService.getEconomicData(req.params.seriesId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Economic data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Market sentiment
router.get('/sentiment/:symbol', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    
    const data = await dataService.getMarketSentiment(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Market sentiment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
