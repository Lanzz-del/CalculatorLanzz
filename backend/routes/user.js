import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getUserApiKeys, upsertUserApiKeys } from '../utils/supabase.js';

const router = express.Router();

// Get user's API keys
router.get('/api-keys', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    
    // Return masked keys for security
    const maskedKeys = apiKeys ? {
      openai_key: maskKey(apiKeys.openai_key),
      anthropic_key: maskKey(apiKeys.anthropic_key),
      google_gemini_key: maskKey(apiKeys.google_gemini_key),
      deepseek_key: maskKey(apiKeys.deepseek_key),
      binance_key: maskKey(apiKeys.binance_key),
      binance_secret: maskKey(apiKeys.binance_secret),
      news_api_key: maskKey(apiKeys.news_api_key),
      openweather_key: maskKey(apiKeys.openweather_key),
      fred_api_key: maskKey(apiKeys.fred_api_key),
      has_openai: !!apiKeys.openai_key,
      has_anthropic: !!apiKeys.anthropic_key,
      has_google_gemini: !!apiKeys.google_gemini_key,
      has_deepseek: !!apiKeys.deepseek_key,
      has_binance: !!apiKeys.binance_key,
      has_news: !!apiKeys.news_api_key,
      has_weather: !!apiKeys.openweather_key,
      has_fred: !!apiKeys.fred_api_key
    } : null;

    res.json({ success: true, apiKeys: maskedKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

// Update user's API keys
router.post('/api-keys', authMiddleware, async (req, res) => {
  try {
    const {
      openai_key,
      anthropic_key,
      google_gemini_key,
      deepseek_key,
      binance_key,
      binance_secret,
      news_api_key,
      openweather_key,
      fred_api_key
    } = req.body;

    const apiKeys = {};
    if (openai_key) apiKeys.openai_key = openai_key;
    if (anthropic_key) apiKeys.anthropic_key = anthropic_key;
    if (google_gemini_key) apiKeys.google_gemini_key = google_gemini_key;
    if (deepseek_key) apiKeys.deepseek_key = deepseek_key;
    if (binance_key) apiKeys.binance_key = binance_key;
    if (binance_secret) apiKeys.binance_secret = binance_secret;
    if (news_api_key) apiKeys.news_api_key = news_api_key;
    if (openweather_key) apiKeys.openweather_key = openweather_key;
    if (fred_api_key) apiKeys.fred_api_key = fred_api_key;

    await upsertUserApiKeys(req.user.userId, apiKeys);

    res.json({ success: true, message: 'API keys updated successfully' });
  } catch (error) {
    console.error('Update API keys error:', error);
    res.status(500).json({ error: 'Failed to update API keys' });
  }
});

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

export default router;
