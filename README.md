# AI Super-App: Multi-LLM Trading Assistant

A comprehensive web application that integrates multiple AI models (OpenAI GPT-4, Anthropic Claude, Google Gemini, DeepSeek) with real-time market data and advanced trading analysis tools.

## 🚀 Features

### Multi-Model AI Routing
- **OpenAI GPT-4o/GPT-4.1**: Advanced reasoning and analysis
- **Anthropic Claude 3.5 Sonnet**: Detailed explanations and safety
- **Google Gemini 1.5 Pro**: Multimodal capabilities
- **DeepSeek V3**: Cost-effective alternative
- **Hybrid Mode**: Query all models simultaneously and get merged responses

### Real-Time Data Integration
- **Crypto Prices**: Live data from Binance API
- **Stock Prices**: Real-time quotes via Yahoo Finance
- **News Feed**: Latest market news from NewsAPI
- **Economic Data**: FRED API integration
- **Weather Data**: OpenWeather API

### Trading Assistant Features
- **Technical Analysis**:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - EMA (Exponential Moving Average)
  - Bollinger Bands
- **Trading Signals**: AI-powered Buy/Sell/Hold recommendations
- **Risk Management Calculator**: Position sizing and risk assessment
- **Backtesting Engine**: Test strategies on historical data
- **Market Sentiment Analysis**: News-based sentiment scoring

### Security & Privacy
- Google OAuth authentication
- Encrypted API key storage in Supabase
- User-specific API keys (never shared)
- JWT-based session management

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Google Cloud Console project (for OAuth)
- API keys for services you want to use

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-super-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Secret (generate a random string)
JWT_SECRET=your_random_jwt_secret_here
```

### 3. Supabase Database Setup

Create the following tables in your Supabase project:

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User API Keys Table:**
```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  openai_key TEXT,
  anthropic_key TEXT,
  google_gemini_key TEXT,
  deepseek_key TEXT,
  binance_key TEXT,
  binance_secret TEXT,
  news_api_key TEXT,
  openweather_key TEXT,
  fred_api_key TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - Your production domain
7. Copy the Client ID and Client Secret to your `.env` file
8. Update `GOOGLE_CLIENT_ID` in `frontend/login.html`

### 5. Frontend Setup

Update the API URL in `frontend/js/app.js` and `frontend/login.html`:

```javascript
const API_URL = 'http://localhost:3001/api'; // Development
// const API_URL = 'https://your-backend-url.com/api'; // Production
```

## 🚀 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
# Use any static server, for example:
python -m http.server 3000
# Or
npx serve -p 3000
```

Visit `http://localhost:3000/login.html`

## 📦 Deployment

### Backend Deployment (Railway/Render)

**Railway:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

**Render:**
1. Create new Web Service
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables in Render dashboard

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Deploy: `vercel`
4. Update API_URL in `js/app.js` to your backend URL
5. Redeploy: `vercel --prod`

**Or use Vercel Dashboard:**
1. Import your repository
2. Set root directory to `frontend`
3. Deploy

## 🔑 API Keys Required

### AI Models (Choose at least one)
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **DeepSeek**: https://platform.deepseek.com/

### Data Sources
- **NewsAPI**: https://newsapi.org/ (Free tier: 100 requests/day)
- **OpenWeather**: https://openweathermap.org/api (Free tier available)
- **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html (Free)
- **Binance**: Optional, only for private trading data
- **Yahoo Finance**: No API key required (via yahoo-finance2 library)

## 📖 Usage Guide

### 1. Login
- Click "Sign in with Google"
- Authorize the application

### 2. Configure API Keys
- Go to "API Settings" tab
- Enter your API keys
- Click "Save API Keys"

### 3. AI Chat
- Select a model or use "Hybrid Mode"
- Type your question
- Get AI-powered responses

### 4. Market Data
- View real-time crypto and stock prices
- Read latest market news
- Monitor multiple assets

### 5. Trading Tools
- **Technical Analysis**: Enter symbol and analyze
- **Risk Management**: Calculate position sizes
- **Backtesting**: Test strategies on historical data

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/JS/CSS)  │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   Backend       │
│  (Node.js/      │
│   Express)      │
└────┬───┬───┬────┘
     │   │   │
     │   │   └──────────┐
     │   │              │
┌────▼───▼────┐   ┌─────▼──────┐
│  Supabase   │   │  External  │
│  (Database) │   │    APIs    │
└─────────────┘   └────────────┘
                  - OpenAI
                  - Anthropic
                  - Google
                  - DeepSeek
                  - Binance
                  - NewsAPI
                  - etc.
```

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Enable CORS** only for your frontend domain in production
4. **Use HTTPS** in production
5. **Rotate API keys** regularly
6. **Monitor API usage** to detect anomalies
7. **Set rate limits** on your backend

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify all environment variables are set
- Check Supabase connection

### Google OAuth fails
- Verify Client ID is correct in frontend
- Check authorized origins in Google Console
- Ensure redirect URIs are configured

### API calls fail
- Check if API keys are saved correctly
- Verify API key validity on provider websites
- Check network connectivity
- Review browser console for errors

### Market data not loading
- Ensure you're authenticated
- Check if required API keys are configured
- Verify backend is running

## 📊 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - Logout

### User Management
- `GET /api/user/api-keys` - Get user's API keys (masked)
- `POST /api/user/api-keys` - Update API keys

### LLM
- `POST /api/llm/query` - Query AI models
- `GET /api/llm/available-models` - Get available models

### Market Data
- `GET /api/data/crypto/:symbol` - Get crypto price
- `GET /api/data/crypto` - Get multiple crypto prices
- `GET /api/data/crypto/:symbol/klines` - Get historical data
- `GET /api/data/stock/:symbol` - Get stock price
- `GET /api/data/stock` - Get multiple stock prices
- `GET /api/data/stock/:symbol/history` - Get stock history
- `GET /api/data/news` - Get news articles
- `GET /api/data/weather/:city` - Get weather data
- `GET /api/data/economic/:seriesId` - Get economic data

### Trading
- `GET /api/trading/analysis/:symbol` - Full technical analysis
- `GET /api/trading/indicators/rsi/:symbol` - RSI calculation
- `GET /api/trading/indicators/macd/:symbol` - MACD calculation
- `GET /api/trading/signal/:symbol` - Trading signal
- `POST /api/trading/risk-management` - Risk calculator
- `GET /api/trading/backtest/:symbol` - Backtest strategy
- `GET /api/trading/sentiment/:symbol` - Market sentiment

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This application is for educational and informational purposes only. It is not financial advice. Always do your own research before making investment decisions. Trading and investing carry risk of loss.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API provider documentation

## 🎯 Roadmap

- [ ] Add more AI models (Llama, Mistral)
- [ ] Implement portfolio tracking
- [ ] Add charting capabilities
- [ ] Mobile app version
- [ ] Advanced backtesting strategies
- [ ] Social trading features
- [ ] Automated trading (with user approval)
- [ ] Multi-language support

## 📚 Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google Gemini Documentation](https://ai.google.dev/docs)
- [DeepSeek Documentation](https://platform.deepseek.com/docs)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [Yahoo Finance API](https://github.com/gadicc/node-yahoo-finance2)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Built with ❤️ for traders and AI enthusiasts**
