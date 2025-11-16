const API_URL = 'http://localhost:3001/api';

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// Get auth headers
function getAuthHeaders() {
    const token = checkAuth();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('user-name').textContent = user.name || user.email || 'User';
    
    loadAvailableModels();
    loadMarketData();
    loadApiKeyStatus();
});

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Tab switching
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active state from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('border-indigo-500', 'text-indigo-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    // Add active state to selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('border-indigo-500', 'text-indigo-600');
    
    // Load data for specific tabs
    if (tabName === 'market') {
        loadMarketData();
    }
}

// Load available models
async function loadAvailableModels() {
    try {
        const response = await fetch(`${API_URL}/llm/available-models`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const selector = document.getElementById('model-selector');
            selector.innerHTML = '';
            
            if (data.canUseHybrid) {
                selector.innerHTML += `<option value="hybrid">Hybrid Mode (${data.hybridCount} Models)</option>`;
            }
            
            data.models.forEach(model => {
                selector.innerHTML += `<option value="${model.id}">${model.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Failed to load models:', error);
    }
}

// Send message to AI
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const model = document.getElementById('model-selector').value;
    const messagesDiv = document.getElementById('chat-messages');
    
    // Clear welcome message
    if (messagesDiv.querySelector('.text-center')) {
        messagesDiv.innerHTML = '';
    }
    
    // Add user message
    addMessage('user', message);
    input.value = '';
    
    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    addMessage('assistant', 'Thinking...', loadingId);
    
    try {
        const response = await fetch(`${API_URL}/llm/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                prompt: message,
                model: model,
                mode: model === 'hybrid' ? 'hybrid' : 'single'
            })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        document.getElementById(loadingId)?.remove();
        
        if (data.success) {
            if (data.result.mode === 'hybrid') {
                // Show hybrid response
                let hybridMessage = data.result.mergedResponse;
                addMessage('assistant', hybridMessage);
            } else {
                addMessage('assistant', data.result.response);
            }
        } else {
            addMessage('assistant', `Error: ${data.error}`, null, true);
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        addMessage('assistant', `Error: ${error.message}`, null, true);
    }
}

// Add message to chat
function addMessage(role, content, id = null, isError = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    
    if (id) messageDiv.id = id;
    
    messageDiv.className = `mb-4 ${role === 'user' ? 'text-right' : 'text-left'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `inline-block max-w-3xl px-4 py-2 rounded-lg ${
        role === 'user' 
            ? 'bg-indigo-600 text-white' 
            : isError 
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-200 text-gray-800'
    }`;
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = content;
    
    messageDiv.appendChild(bubble);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Quick query
function quickQuery(query) {
    document.getElementById('chat-input').value = query;
    sendMessage();
}

// Load market data
async function loadMarketData() {
    loadCryptoPrices();
    loadStockPrices();
    loadNews();
}

async function loadCryptoPrices() {
    try {
        const response = await fetch(`${API_URL}/data/crypto?symbols=BTCUSDT,ETHUSDT,BNBUSDT`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('crypto-prices');
            container.innerHTML = data.data.map(crypto => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div class="font-semibold">${crypto.symbol}</div>
                        <div class="text-2xl font-bold">$${crypto.price.toFixed(2)}</div>
                    </div>
                    <div class="text-right">
                        <div class="${crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                            ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%
                        </div>
                        <div class="text-sm text-gray-500">24h</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load crypto prices:', error);
        document.getElementById('crypto-prices').innerHTML = '<div class="text-red-500">Failed to load</div>';
    }
}

async function loadStockPrices() {
    try {
        const response = await fetch(`${API_URL}/data/stock?symbols=AAPL,GOOGL,MSFT`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('stock-prices');
            container.innerHTML = data.data.map(stock => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div class="font-semibold">${stock.symbol}</div>
                        <div class="text-2xl font-bold">$${stock.price.toFixed(2)}</div>
                    </div>
                    <div class="text-right">
                        <div class="${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                            ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                        </div>
                        <div class="text-sm text-gray-500">Today</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load stock prices:', error);
        document.getElementById('stock-prices').innerHTML = '<div class="text-red-500">Failed to load</div>';
    }
}

async function loadNews() {
    try {
        const response = await fetch(`${API_URL}/data/news?query=cryptocurrency&category=business`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('news-feed');
            container.innerHTML = data.data.slice(0, 5).map(article => `
                <div class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onclick="window.open('${article.url}', '_blank')">
                    <div class="font-semibold text-sm mb-1">${article.title}</div>
                    <div class="text-xs text-gray-500">${article.source}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load news:', error);
        document.getElementById('news-feed').innerHTML = '<div class="text-gray-500">News API key required</div>';
    }
}

// Run technical analysis
async function runAnalysis() {
    const symbol = document.getElementById('analysis-symbol').value;
    const type = document.getElementById('analysis-type').value;
    const resultsDiv = document.getElementById('analysis-results');
    
    resultsDiv.innerHTML = '<div class="text-center py-4">Analyzing...</div>';
    
    try {
        const response = await fetch(`${API_URL}/trading/analysis/${symbol}?type=${type}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const analysis = data.analysis;
            resultsDiv.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-${analysis.signal.signal === 'BUY' ? 'green' : analysis.signal.signal === 'SELL' ? 'red' : 'gray'}-100 p-4 rounded-lg">
                        <div class="text-2xl font-bold text-${analysis.signal.signal === 'BUY' ? 'green' : analysis.signal.signal === 'SELL' ? 'red' : 'gray'}-800">
                            ${analysis.signal.signal}
                        </div>
                        <div class="text-sm">Confidence: ${analysis.signal.confidence}%</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm text-gray-600">RSI</div>
                            <div class="text-xl font-bold">${analysis.signal.indicators.rsi}</div>
                            <div class="text-xs text-gray-500">${analysis.signal.indicators.rsiSignal}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm text-gray-600">MACD</div>
                            <div class="text-xl font-bold">${analysis.signal.indicators.macd}</div>
                            <div class="text-xs text-gray-500">${analysis.signal.indicators.macdSignal}</div>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-600">
                        Current Price: $${data.currentPrice.toFixed(2)}
                    </div>
                </div>
            `;
        } else {
            resultsDiv.innerHTML = `<div class="text-red-500">${data.error}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    }
}

// Calculate risk management
async function calculateRisk() {
    const balance = document.getElementById('risk-balance').value;
    const percentage = document.getElementById('risk-percentage').value;
    const entry = document.getElementById('risk-entry').value;
    const stopLoss = document.getElementById('risk-stoploss').value;
    const resultsDiv = document.getElementById('risk-results');
    
    try {
        const response = await fetch(`${API_URL}/trading/risk-management`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                accountBalance: parseFloat(balance),
                riskPercentage: parseFloat(percentage),
                entryPrice: parseFloat(entry),
                stopLoss: parseFloat(stopLoss)
            })
        });
        const data = await response.json();
        
        if (data.success) {
            const rm = data.riskManagement;
            resultsDiv.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Risk Amount:</span>
                        <span class="font-bold">$${rm.riskAmount}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Position Size:</span>
                        <span class="font-bold">${rm.positionSize} units</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Potential Loss:</span>
                        <span class="font-bold text-red-600">$${rm.potentialLoss}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-4 pt-4 border-t">
                        ${rm.recommendation}
                    </div>
                </div>
            `;
        } else {
            resultsDiv.innerHTML = `<div class="text-red-500">${data.error}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    }
}

// Load API key status
async function loadApiKeyStatus() {
    try {
        const response = await fetch(`${API_URL}/user/api-keys`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success && data.apiKeys) {
            // Show masked keys
            if (data.apiKeys.openai_key) document.getElementById('key-openai').placeholder = data.apiKeys.openai_key;
            if (data.apiKeys.anthropic_key) document.getElementById('key-anthropic').placeholder = data.apiKeys.anthropic_key;
            if (data.apiKeys.google_gemini_key) document.getElementById('key-gemini').placeholder = data.apiKeys.google_gemini_key;
            if (data.apiKeys.deepseek_key) document.getElementById('key-deepseek').placeholder = data.apiKeys.deepseek_key;
            if (data.apiKeys.binance_key) document.getElementById('key-binance').placeholder = data.apiKeys.binance_key;
            if (data.apiKeys.news_api_key) document.getElementById('key-news').placeholder = data.apiKeys.news_api_key;
            if (data.apiKeys.openweather_key) document.getElementById('key-weather').placeholder = data.apiKeys.openweather_key;
            if (data.apiKeys.fred_api_key) document.getElementById('key-fred').placeholder = data.apiKeys.fred_api_key;
        }
    } catch (error) {
        console.error('Failed to load API keys:', error);
    }
}

// Save API keys
async function saveApiKeys() {
    const keys = {
        openai_key: document.getElementById('key-openai').value,
        anthropic_key: document.getElementById('key-anthropic').value,
        google_gemini_key: document.getElementById('key-gemini').value,
        deepseek_key: document.getElementById('key-deepseek').value,
        binance_key: document.getElementById('key-binance').value,
        binance_secret: document.getElementById('key-binance-secret').value,
        news_api_key: document.getElementById('key-news').value,
        openweather_key: document.getElementById('key-weather').value,
        fred_api_key: document.getElementById('key-fred').value
    };
    
    // Remove empty keys
    Object.keys(keys).forEach(key => {
        if (!keys[key]) delete keys[key];
    });
    
    try {
        const response = await fetch(`${API_URL}/user/api-keys`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(keys)
        });
        const data = await response.json();
        
        const messageDiv = document.getElementById('settings-message');
        messageDiv.classList.remove('hidden');
        
        if (data.success) {
            messageDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
            messageDiv.textContent = 'API keys saved successfully!';
            
            // Clear input fields
            document.querySelectorAll('#content-settings input[type="password"]').forEach(input => {
                input.value = '';
            });
            
            // Reload available models
            loadAvailableModels();
        } else {
            messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
            messageDiv.textContent = data.error || 'Failed to save API keys';
        }
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    } catch (error) {
        const messageDiv = document.getElementById('settings-message');
        messageDiv.classList.remove('hidden');
        messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        messageDiv.textContent = 'Error: ' + error.message;
    }
}
