import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getUserApiKeys } from '../utils/supabase.js';
import { LLMService } from '../services/llm.js';

const router = express.Router();

router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { prompt, model, mode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get user's API keys
    const apiKeys = await getUserApiKeys(req.user.userId);
    
    if (!apiKeys) {
      return res.status(400).json({ 
        error: 'No API keys configured. Please add your API keys in the dashboard.' 
      });
    }

    const llmService = new LLMService(apiKeys);

    let result;

    if (mode === 'hybrid') {
      result = await llmService.queryHybrid(prompt);
    } else {
      switch (model) {
        case 'openai':
        case 'gpt-4o':
        case 'gpt-4':
          result = await llmService.queryOpenAI(prompt, model === 'openai' ? 'gpt-4o' : model);
          break;
        case 'anthropic':
        case 'claude':
          result = await llmService.queryAnthropic(prompt);
          break;
        case 'gemini':
        case 'google':
          result = await llmService.queryGemini(prompt);
          break;
        case 'deepseek':
          result = await llmService.queryDeepSeek(prompt);
          break;
        default:
          return res.status(400).json({ error: 'Invalid model specified' });
      }
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('LLM query error:', error);
    res.status(500).json({ error: error.message || 'Failed to query LLM' });
  }
});

// Get available models based on user's API keys
router.get('/available-models', authMiddleware, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    
    const availableModels = [];
    
    if (apiKeys?.openai_key) {
      availableModels.push({ id: 'openai', name: 'OpenAI GPT-4o', provider: 'OpenAI' });
    }
    if (apiKeys?.anthropic_key) {
      availableModels.push({ id: 'anthropic', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' });
    }
    if (apiKeys?.google_gemini_key) {
      availableModels.push({ id: 'gemini', name: 'Gemini 1.5 Pro', provider: 'Google' });
    }
    if (apiKeys?.deepseek_key) {
      availableModels.push({ id: 'deepseek', name: 'DeepSeek V3', provider: 'DeepSeek' });
    }

    const canUseHybrid = availableModels.length >= 2;

    res.json({ 
      success: true, 
      models: availableModels,
      canUseHybrid,
      hybridCount: availableModels.length
    });
  } catch (error) {
    console.error('Get available models error:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

export default router;
