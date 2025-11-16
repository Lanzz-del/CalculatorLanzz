export class TradingService {
  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      throw new Error('Not enough data points for RSI calculation');
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    const rsiValues = [];

    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }

    const currentRSI = rsiValues[rsiValues.length - 1];
    
    return {
      current: currentRSI,
      signal: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral',
      values: rsiValues
    };
  }

  // Calculate EMA (Exponential Moving Average)
  calculateEMA(prices, period = 12) {
    if (prices.length < period) {
      throw new Error('Not enough data points for EMA calculation');
    }

    const k = 2 / (period + 1);
    const emaValues = [];

    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    let ema = sum / period;
    emaValues.push(ema);

    // Calculate EMA
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
      emaValues.push(ema);
    }

    return {
      current: emaValues[emaValues.length - 1],
      values: emaValues
    };
  }

  // Calculate MACD (Moving Average Convergence Divergence)
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    const macdLine = [];
    const startIndex = slowPeriod - fastPeriod;

    for (let i = 0; i < fastEMA.values.length - startIndex; i++) {
      macdLine.push(fastEMA.values[i + startIndex] - slowEMA.values[i]);
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = [];

    for (let i = 0; i < signalLine.values.length; i++) {
      histogram.push(macdLine[i + (macdLine.length - signalLine.values.length)] - signalLine.values[i]);
    }

    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine.values[signalLine.values.length - 1];
    const currentHistogram = histogram[histogram.length - 1];

    return {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram,
      trend: currentHistogram > 0 ? 'Bullish' : 'Bearish',
      crossover: this.detectCrossover(macdLine, signalLine.values)
    };
  }

  detectCrossover(line1, line2) {
    if (line1.length < 2 || line2.length < 2) return 'None';
    
    const prevDiff = line1[line1.length - 2] - line2[line2.length - 2];
    const currDiff = line1[line1.length - 1] - line2[line2.length - 1];

    if (prevDiff < 0 && currDiff > 0) return 'Bullish Crossover';
    if (prevDiff > 0 && currDiff < 0) return 'Bearish Crossover';
    return 'None';
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      throw new Error('Not enough data points for Bollinger Bands calculation');
    }

    const sma = [];
    const upperBand = [];
    const lowerBand = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const std = Math.sqrt(variance);

      sma.push(mean);
      upperBand.push(mean + stdDev * std);
      lowerBand.push(mean - stdDev * std);
    }

    const currentPrice = prices[prices.length - 1];
    const currentUpper = upperBand[upperBand.length - 1];
    const currentLower = lowerBand[lowerBand.length - 1];
    const currentSMA = sma[sma.length - 1];

    return {
      upper: currentUpper,
      middle: currentSMA,
      lower: currentLower,
      signal: currentPrice > currentUpper ? 'Overbought' : currentPrice < currentLower ? 'Oversold' : 'Normal'
    };
  }

  // Generate Trading Signal
  generateSignal(prices) {
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);

    let bullishSignals = 0;
    let bearishSignals = 0;

    // RSI signals
    if (rsi.signal === 'Oversold') bullishSignals++;
    if (rsi.signal === 'Overbought') bearishSignals++;

    // MACD signals
    if (macd.trend === 'Bullish') bullishSignals++;
    if (macd.trend === 'Bearish') bearishSignals++;
    if (macd.crossover === 'Bullish Crossover') bullishSignals += 2;
    if (macd.crossover === 'Bearish Crossover') bearishSignals += 2;

    // Bollinger Bands signals
    if (bb.signal === 'Oversold') bullishSignals++;
    if (bb.signal === 'Overbought') bearishSignals++;

    let signal = 'HOLD';
    let confidence = 0;

    if (bullishSignals > bearishSignals) {
      signal = 'BUY';
      confidence = (bullishSignals / (bullishSignals + bearishSignals)) * 100;
    } else if (bearishSignals > bullishSignals) {
      signal = 'SELL';
      confidence = (bearishSignals / (bullishSignals + bearishSignals)) * 100;
    }

    return {
      signal,
      confidence: confidence.toFixed(1),
      indicators: {
        rsi: rsi.current.toFixed(2),
        rsiSignal: rsi.signal,
        macd: macd.macd.toFixed(4),
        macdSignal: macd.trend,
        macdCrossover: macd.crossover,
        bollingerBands: bb.signal
      },
      analysis: {
        bullishSignals,
        bearishSignals
      }
    };
  }

  // Risk Management Calculator
  calculateRiskManagement(accountBalance, riskPercentage, entryPrice, stopLoss) {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const priceRisk = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / priceRisk;
    const potentialLoss = positionSize * priceRisk;

    return {
      accountBalance,
      riskPercentage,
      riskAmount: riskAmount.toFixed(2),
      entryPrice,
      stopLoss,
      priceRisk: priceRisk.toFixed(2),
      positionSize: positionSize.toFixed(4),
      potentialLoss: potentialLoss.toFixed(2),
      recommendation: `Risk ${riskAmount.toFixed(2)} (${riskPercentage}% of account) with position size of ${positionSize.toFixed(4)} units`
    };
  }

  // Simple Backtesting
  backtest(historicalData, strategy = 'rsi') {
    const trades = [];
    let position = null;
    let capital = 10000;
    let initialCapital = capital;

    for (let i = 50; i < historicalData.length; i++) {
      const prices = historicalData.slice(0, i + 1).map(d => d.close);
      const currentPrice = prices[prices.length - 1];

      let signal;
      if (strategy === 'rsi') {
        const rsi = this.calculateRSI(prices);
        signal = rsi.signal === 'Oversold' ? 'BUY' : rsi.signal === 'Overbought' ? 'SELL' : 'HOLD';
      } else if (strategy === 'macd') {
        const macd = this.calculateMACD(prices);
        signal = macd.crossover === 'Bullish Crossover' ? 'BUY' : macd.crossover === 'Bearish Crossover' ? 'SELL' : 'HOLD';
      } else {
        const fullSignal = this.generateSignal(prices);
        signal = fullSignal.signal;
      }

      // Execute trades
      if (signal === 'BUY' && !position) {
        const shares = Math.floor(capital / currentPrice);
        position = {
          entryPrice: currentPrice,
          shares: shares,
          entryDate: historicalData[i].timestamp
        };
        capital -= shares * currentPrice;
      } else if (signal === 'SELL' && position) {
        const profit = (currentPrice - position.entryPrice) * position.shares;
        capital += position.shares * currentPrice;
        
        trades.push({
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          shares: position.shares,
          profit: profit,
          profitPercent: ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2),
          entryDate: position.entryDate,
          exitDate: historicalData[i].timestamp
        });
        
        position = null;
      }
    }

    // Close any open position
    if (position) {
      const currentPrice = historicalData[historicalData.length - 1].close;
      const profit = (currentPrice - position.entryPrice) * position.shares;
      capital += position.shares * currentPrice;
      
      trades.push({
        entryPrice: position.entryPrice,
        exitPrice: currentPrice,
        shares: position.shares,
        profit: profit,
        profitPercent: ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2),
        entryDate: position.entryDate,
        exitDate: historicalData[historicalData.length - 1].timestamp
      });
    }

    const totalProfit = capital - initialCapital;
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit < 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(2) : 0;

    return {
      strategy,
      initialCapital,
      finalCapital: capital.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      profitPercent: ((totalProfit / initialCapital) * 100).toFixed(2),
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate: winRate + '%',
      trades: trades.slice(-10) // Return last 10 trades
    };
  }
}
