import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export class LLMService {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
  }

  async queryOpenAI(prompt, model = 'gpt-4o') {
    if (!this.apiKeys.openai_key) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey: this.apiKeys.openai_key });
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      model: 'OpenAI ' + model,
      response: response.choices[0].message.content,
      usage: response.usage
    };
  }

  async queryAnthropic(prompt, model = 'claude-3-5-sonnet-20241022') {
    if (!this.apiKeys.anthropic_key) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({ apiKey: this.apiKeys.anthropic_key });
    
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      model: 'Anthropic Claude 3.5',
      response: response.content[0].text,
      usage: response.usage
    };
  }

  async queryGemini(prompt, model = 'gemini-1.5-pro') {
    if (!this.apiKeys.google_gemini_key) {
      throw new Error('Google Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(this.apiKeys.google_gemini_key);
    const geminiModel = genAI.getGenerativeModel({ model: model });
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;

    return {
      model: 'Google Gemini 1.5 Pro',
      response: response.text(),
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    };
  }

  async queryDeepSeek(prompt, model = 'deepseek-chat') {
    if (!this.apiKeys.deepseek_key) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.deepseek_key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      model: 'DeepSeek V3',
      response: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  }

  async queryHybrid(prompt) {
    const results = [];
    const errors = [];

    // Query all available models in parallel
    const promises = [];

    if (this.apiKeys.openai_key) {
      promises.push(
        this.queryOpenAI(prompt).catch(err => {
          errors.push({ model: 'OpenAI', error: err.message });
          return null;
        })
      );
    }

    if (this.apiKeys.anthropic_key) {
      promises.push(
        this.queryAnthropic(prompt).catch(err => {
          errors.push({ model: 'Anthropic', error: err.message });
          return null;
        })
      );
    }

    if (this.apiKeys.google_gemini_key) {
      promises.push(
        this.queryGemini(prompt).catch(err => {
          errors.push({ model: 'Gemini', error: err.message });
          return null;
        })
      );
    }

    if (this.apiKeys.deepseek_key) {
      promises.push(
        this.queryDeepSeek(prompt).catch(err => {
          errors.push({ model: 'DeepSeek', error: err.message });
          return null;
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // Filter out null responses
    const validResponses = responses.filter(r => r !== null);

    if (validResponses.length === 0) {
      throw new Error('All models failed to respond: ' + JSON.stringify(errors));
    }

    // Merge responses intelligently
    const mergedResponse = this.mergeResponses(validResponses);

    return {
      mode: 'hybrid',
      individualResponses: validResponses,
      mergedResponse: mergedResponse,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  mergeResponses(responses) {
    if (responses.length === 1) {
      return responses[0].response;
    }

    // Simple merging strategy: combine insights from all models
    let merged = "**Hybrid AI Analysis (Combined from multiple models):**\n\n";
    
    responses.forEach((resp, idx) => {
      merged += `**${resp.model}:**\n${resp.response}\n\n`;
    });

    merged += "\n**Consensus Summary:**\n";
    merged += "Based on analysis from " + responses.length + " AI models, ";
    merged += "the key insights have been presented above. ";
    merged += "Cross-reference the responses for the most accurate information.";

    return merged;
  }
}
