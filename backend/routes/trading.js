import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getUserApiKeys } from '../utils/supabase.js';
import { RealtimeDataService } from '../services/realtime-data.js';
import { TradingService } from '../services/trading.js';

const router = express.Router();

// Technical Analysis
router.get('/analysis/:symbol', authMiddleware, async (req, res) => {
  try {
    const { type = 'crypto', interval = '1h', limit = 100 } = req.query;
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    const tradingService = new TradingService();

    let historicalData;
    
    if (type === 'crypto') {
      historicalData = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    } else {
      historicalData = await dataService.getStockHistory(req.params.symbol);
    }

    const prices = historicalData.map(d => d.close);

    const rsi = tradingService.calculateRSI(prices);
    const macd = tradingService.calculateMACD(prices);
    const bb = tradingService.calculateBollingerBands(prices);
    const signal = tradingService.generateSignal(prices);

    res.json({
      success: true,
      symbol: req.params.symbol,
      type,
      analysis: {
        rsi,
        macd,
        bollingerBands: bb,
        signal
      },
      currentPrice: prices[prices.length - 1]
    });
  } catch (error) {
    console.error('Technical analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSI Calculation
router.get('/indicators/rsi/:symbol', authMiddleware, async (req, res) => {
  try {
    const { type = 'crypto', period = 14, interval = '1h', limit = 100 } = req.query;
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    const tradingService = new TradingService();

    let historicalData;
    if (type === 'crypto') {
      historicalData = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    } else {
      historicalData = await dataService.getStockHistory(req.params.symbol);
    }

    const prices = historicalData.map(d => d.close);
    const rsi = tradingService.calculateRSI(prices, parseInt(period));

    res.json({ success: true, symbol: req.params.symbol, rsi });
  } catch (error) {
    console.error('RSI calculation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// MACD Calculation
router.get('/indicators/macd/:symbol', authMiddleware, async (req, res) => {
  try {
    const { type = 'crypto', interval = '1h', limit = 100 } = req.query;
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    const tradingService = new TradingService();

    let historicalData;
    if (type === 'crypto') {
      historicalData = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    } else {
      historicalData = await dataService.getStockHistory(req.params.symbol);
    }

    const prices = historicalData.map(d => d.close);
    const macd = tradingService.calculateMACD(prices);

    res.json({ success: true, symbol: req.params.symbol, macd });
  } catch (error) {
    console.error('MACD calculation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trading Signal
router.get('/signal/:symbol', authMiddleware, async (req, res) => {
  try {
    const { type = 'crypto', interval = '1h', limit = 100 } = req.query;
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    const tradingService = new TradingService();

    let historicalData;
    if (type === 'crypto') {
      historicalData = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    } else {
      historicalData = await dataService.getStockHistory(req.params.symbol);
    }

    const prices = historicalData.map(d => d.close);
    const signal = tradingService.generateSignal(prices);

    res.json({ 
      success: true, 
      symbol: req.params.symbol, 
      currentPrice: prices[prices.length - 1],
      signal 
    });
  } catch (error) {
    console.error('Trading signal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Risk Management
router.post('/risk-management', authMiddleware, async (req, res) => {
  try {
    const { accountBalance, riskPercentage, entryPrice, stopLoss } = req.body;

    if (!accountBalance || !riskPercentage || !entryPrice || !stopLoss) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const tradingService = new TradingService();
    const riskManagement = tradingService.calculateRiskManagement(
      parseFloat(accountBalance),
      parseFloat(riskPercentage),
      parseFloat(entryPrice),
      parseFloat(stopLoss)
    );

    res.json({ success: true, riskManagement });
  } catch (error) {
    console.error('Risk management error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backtesting
router.get('/backtest/:symbol', authMiddleware, async (req, res) => {
  try {
    const { type = 'crypto', strategy = 'combined', interval = '1h', limit = 500 } = req.query;
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});
    const tradingService = new TradingService();

    let historicalData;
    if (type === 'crypto') {
      historicalData = await dataService.getCryptoKlines(req.params.symbol, interval, parseInt(limit));
    } else {
      historicalData = await dataService.getStockHistory(req.params.symbol);
    }

    const backtest = tradingService.backtest(historicalData, strategy);

    res.json({ 
      success: true, 
      symbol: req.params.symbol,
      backtest 
    });
  } catch (error) {
    console.error('Backtesting error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Market Sentiment
router.get('/sentiment/:symbol', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    const dataService = new RealtimeDataService(apiKeys || {});

    const sentiment = await dataService.getMarketSentiment(req.params.symbol);

    res.json({ 
      success: true, 
      symbol: req.params.symbol,
      sentiment 
    });
  } catch (error) {
    console.error('Market sentiment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
