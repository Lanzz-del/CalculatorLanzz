import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

export class RealtimeDataService {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
  }

  // Binance Crypto Prices
  async getCryptoPrice(symbol = 'BTCUSDT') {
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      return {
        symbol: response.data.symbol,
        price: parseFloat(response.data.lastPrice),
        change24h: parseFloat(response.data.priceChangePercent),
        high24h: parseFloat(response.data.highPrice),
        low24h: parseFloat(response.data.lowPrice),
        volume24h: parseFloat(response.data.volume),
        timestamp: new Date(response.data.closeTime)
      };
    } catch (error) {
      throw new Error(`Failed to fetch crypto price: ${error.message}`);
    }
  }

  async getMultipleCryptoPrices(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) {
    try {
      const promises = symbols.map(symbol => this.getCryptoPrice(symbol));
      return await Promise.all(promises);
    } catch (error) {
      throw new Error(`Failed to fetch multiple crypto prices: ${error.message}`);
    }
  }

  async getCryptoKlines(symbol = 'BTCUSDT', interval = '1h', limit = 100) {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      return response.data.map(candle => ({
        timestamp: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      throw new Error(`Failed to fetch crypto klines: ${error.message}`);
    }
  }

  // Yahoo Finance Stock Prices
  async getStockPrice(symbol = 'AAPL') {
    try {
      const quote = await yahooFinance.quote(symbol);
      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock price: ${error.message}`);
    }
  }

  async getMultipleStockPrices(symbols = ['AAPL', 'GOOGL', 'MSFT']) {
    try {
      const promises = symbols.map(symbol => this.getStockPrice(symbol));
      return await Promise.all(promises);
    } catch (error) {
      throw new Error(`Failed to fetch multiple stock prices: ${error.message}`);
    }
  }

  async getStockHistory(symbol, period1, period2) {
    try {
      const history = await yahooFinance.historical(symbol, {
        period1: period1 || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        period2: period2 || new Date()
      });
      
      return history.map(candle => ({
        timestamp: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));
    } catch (error) {
      throw new Error(`Failed to fetch stock history: ${error.message}`);
    }
  }

  // News API
  async getNews(query = 'cryptocurrency', category = 'business') {
    if (!this.apiKeys.news_api_key) {
      throw new Error('News API key not configured');
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          q: query,
          category: category,
          language: 'en',
          pageSize: 10,
          apiKey: this.apiKeys.news_api_key
        }
      });

      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        image: article.urlToImage
      }));
    } catch (error) {
      throw new Error(`Failed to fetch news: ${error.message}`);
    }
  }

  // OpenWeather API
  async getWeather(city = 'New York') {
    if (!this.apiKeys.openweather_key) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: city,
          appid: this.apiKeys.openweather_key,
          units: 'metric'
        }
      });

      return {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: response.data.wind.speed,
        timestamp: new Date(response.data.dt * 1000)
      };
    } catch (error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
  }

  // FRED Economic Data
  async getEconomicData(seriesId = 'GDP') {
    if (!this.apiKeys.fred_api_key) {
      throw new Error('FRED API key not configured');
    }

    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: seriesId,
          api_key: this.apiKeys.fred_api_key,
          file_type: 'json',
          limit: 10,
          sort_order: 'desc'
        }
      });

      return {
        seriesId: seriesId,
        data: response.data.observations.map(obs => ({
          date: new Date(obs.date),
          value: parseFloat(obs.value)
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch economic data: ${error.message}`);
    }
  }

  // Market Sentiment Analysis
  async getMarketSentiment(symbol) {
    try {
      const news = await this.getNews(symbol);
      
      // Simple sentiment scoring based on keywords
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;

      const positiveWords = ['surge', 'gain', 'rise', 'bull', 'growth', 'profit', 'success', 'high', 'up'];
      const negativeWords = ['fall', 'drop', 'bear', 'loss', 'decline', 'crash', 'down', 'risk'];

      news.forEach(article => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        const hasPositive = positiveWords.some(word => text.includes(word));
        const hasNegative = negativeWords.some(word => text.includes(word));

        if (hasPositive && !hasNegative) positiveCount++;
        else if (hasNegative && !hasPositive) negativeCount++;
        else neutralCount++;
      });

      const total = news.length;
      const sentiment = {
        positive: (positiveCount / total * 100).toFixed(1),
        negative: (negativeCount / total * 100).toFixed(1),
        neutral: (neutralCount / total * 100).toFixed(1),
        overall: positiveCount > negativeCount ? 'Bullish' : negativeCount > positiveCount ? 'Bearish' : 'Neutral',
        newsCount: total
      };

      return sentiment;
    } catch (error) {
      throw new Error(`Failed to analyze market sentiment: ${error.message}`);
    }
  }
}
