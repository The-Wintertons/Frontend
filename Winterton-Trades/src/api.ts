import type {
  PortfolioChartResponse,
  StatsResponse,
  UptimeResponse,
  RecentTrade,
  RecentTradesResponse,
  TradeHistoryResponse,
  MarketIndicesResponse,
  HeadlinesResponse
} from './types/apiTypeDefinitions'

export async function fetchStats(portfolio?: string): Promise<StatsResponse> {
  // TODO: replace with `return await (await fetch('/api/stats')).json()`
  return {
    lifetimeReturns: '10%',
    solvency: '2%',
    timeSinceLastTrade: '2d 12h 02m',
  }
}

export async function fetchPortfolioChart(portfolio?: string): Promise<PortfolioChartResponse> {
  // TODO: replace with `return await (await fetch('/api/portfolio/history')).json()`
  const data = []
  const dayMs = 86400000
  const totalDays = 30
  const startTime = Date.now() - (totalDays - 1) * dayMs
  let portfolioValue = 10000

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startTime + i * dayMs)
    const dateStr = date.toISOString().split('T')[0]!
    const dailyReturn = 0.0003 + (Math.random() - 0.48) * 0.024
    const drawdownChance = Math.random()
    const drawdownMultiplier = drawdownChance < 0.03 ? -0.02 : drawdownChance < 0.07 ? -0.008 : 0
    portfolioValue *= (1 + dailyReturn + drawdownMultiplier)
    portfolioValue = Math.max(portfolioValue * 0.95, portfolioValue)
    data.push({ time: dateStr, value: Math.round(portfolioValue * 100) / 100 })
  }

  return { data }
}

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'DOGE/USDT', 'ADA/USDT']
const basePrices: Record<string, number> = {
  'BTC/USDT': 42100,
  'ETH/USDT': 2320,
  'SOL/USDT': 112,
  'AVAX/USDT': 38,
  'DOGE/USDT': 0.089,
  'ADA/USDT': 0.62,
}

export async function fetchRecentTrades(portfolio?: string): Promise<RecentTradesResponse> {
  // TODO: replace with a real API call
  return {
    trades: [
      { time: '10:32:14', pair: 'BTC/USDT', type: 'Buy', price: '$42,183.22' },
      { time: '10:31:58', pair: 'ETH/USDT', type: 'Sell', price: '$2,318.77' },
      { time: '10:30:45', pair: 'SOL/USDT', type: 'Buy', price: '$112.04' },
      { time: '10:29:03', pair: 'BTC/USDT', type: 'Sell', price: '$42,101.10' },
      { time: '10:28:41', pair: 'AVAX/USDT', type: 'Buy', price: '$38.15' },
      { time: '10:28:02', pair: 'ETH/USDT', type: 'Buy', price: '$2,322.10' },
    ]
  }
}

export function generateRecentTrade(portfolio?: string): RecentTrade {
  const pair = pairs[Math.floor(Math.random() * pairs.length)]!
  const type: 'Buy' | 'Sell' = Math.random() > 0.5 ? 'Buy' : 'Sell'
  const base = basePrices[pair]
  const variation = base! * (Math.random() * 0.004 - 0.002)
  const price = base! + variation
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour12: false })

  return {
    time,
    pair,
    type,
    price: price >= 1
      ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${price.toFixed(4)}`,
  }
}

export async function fetchTradeHistory(count: number = 150, timeWindowMs: number = 30 * 24 * 60 * 60 * 1000, portfolio?: string): Promise<TradeHistoryResponse> {
  // TODO: replace with `return await (await fetch('/api/trade-history')).json()`
  const now = Date.now()
  const trades = []

  for (let i = 0; i < count; i++) {
    const tradeTime = new Date(now - Math.random() * timeWindowMs)
    const pair = pairs[Math.floor(Math.random() * pairs.length)]!
    const base = basePrices[pair]!
    const price = Math.round(base * (1 + (Math.random() - 0.5) * 0.01) * 100) / 100
    const type: 'Buy' | 'Sell' = Math.random() > 0.45 ? 'Buy' : 'Sell'
    const quantity = pair.startsWith('BTC')
      ? +(Math.random() * 0.5 + 0.01).toFixed(4)
      : pair.startsWith('DOGE') || pair.startsWith('ADA')
        ? +(Math.random() * 5000 + 100).toFixed(2)
        : +(Math.random() * 10 + 0.1).toFixed(4)

    trades.push({
      id: 1000 + i,
      date: tradeTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: tradeTime.toLocaleTimeString('en-US', { hour12: false }),
      pair,
      type,
      price,
      quantity,
      total: Math.round(price * quantity * 100) / 100,
      status: Math.random() > 0.1 ? 'Filled' : Math.random() > 0.5 ? 'Partial' : 'Cancelled' as any
    })
  }

  trades.sort((a, b) => {
    const tA = new Date(`${a.date} ${a.time}`).getTime()
    const tB = new Date(`${b.date} ${b.time}`).getTime()
    return tB - tA
  })

  return { trades, totalCount: trades.length }
}

export async function fetchUptime(portfolio?: string): Promise<UptimeResponse> {
  // TODO: replace with `return await (await fetch('/api/uptime')).json()`
  const generatedBars = []
  for (let i = 0; i < 30; i++) {
    const value = Math.random() > 0.02 ? 100 : Math.random() * 50 + 50
    generatedBars.push({
      value,
      color: value === 100 ? '#26a69a' : value > 80 ? '#ffc107' : '#ef5350',
    })
  }

  const timeline = []
  for (let i = 0; i < 40; i++) {
    timeline.push(150 + Math.random() * 200)
  }

  return {
    uptimePercent: '100.000%',
    avgResponseTime: '221.22ms',
    statusBars: generatedBars,
    responseTimeline: timeline,
  }
}

let cachedIndices: MarketIndicesResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60000; // 1 minute

export async function fetchMarketIndices(portfolio?: string): Promise<MarketIndicesResponse> {
  const now = Date.now();
  
  // Return cached data if we fetched successfully within the last minute to prevent rate limits
  if (cachedIndices && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    return cachedIndices;
  }

  const fallbackData = {
    indices: [
      { symbol: 'SPX',   name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'DJI',   name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'IXIC',  name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'RUT',   name: 'API Error', value: 0, change: 0, changePercent: 0 }
    ],
  };

  try {
    // Yahoo Finance v7 requires authentication now, but v8 charts API is still public.
    // We send four separate requests via the Vite proxy and wait for all of them.
    const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT'];
    const fetchPromises = symbols.map(sym => 
      fetch(`/fin-api/v8/finance/chart/${sym}?interval=1d&range=1d`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
    );

    const responses = await Promise.all(fetchPromises);
    
    // Parse the chart metadata to extract the exact same quote information
    const indices = responses.reduce((acc: any[], data: any) => {
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) return acc;

      let symbol = meta.symbol;
      let name = meta.shortName || meta.symbol;

      if (symbol === '^GSPC') { symbol = 'SPX'; name = 'S&P 500'; }
      if (symbol === '^DJI') { symbol = 'DJI'; name = 'Dow Jones'; }
      if (symbol === '^IXIC') { symbol = 'IXIC'; name = 'NASDAQ'; }
      if (symbol === '^RUT') { symbol = 'RUT'; name = 'Russell 2000'; }

      const price = meta.regularMarketPrice || 0;
      const prevClose = meta.chartPreviousClose || meta.previousClose || price;
      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      acc.push({
        symbol,
        name,
        value: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2))
      });

      return acc;
    }, []);

    if (indices.length === 0) {
      return cachedIndices || fallbackData;
    }

    cachedIndices = { indices };
    cacheTimestamp = now;

    return cachedIndices;
  } catch (error) {
    console.error('Error fetching dynamic market data:', error);
    // If the network fails entirely, fall back so the UI doesn't break
    return cachedIndices || fallbackData;
  }
}

let cachedHeadlines: HeadlinesResponse | null = null;
let cacheHeadlinesTimestamp = 0;
const CACHE_HEADLINES_DURATION_MS = 60000; // 1 minute

export async function fetchTopHeadlines(): Promise<HeadlinesResponse> {
  const now = Date.now();
  if (cachedHeadlines && (now - cacheHeadlinesTimestamp < CACHE_HEADLINES_DURATION_MS)) {
    return cachedHeadlines;
  }

  const fallbackData: HeadlinesResponse = { headlines: [] };

  try {
    const res = await fetch(`/fin-api/v1/finance/search?q=finance&newsCount=10`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    if (data.news && Array.isArray(data.news)) {
      const headlines = data.news.map((item: any) => ({
        uuid: item.uuid,
        title: item.title,
        publisher: item.publisher,
        link: item.link,
        providerPublishTime: item.providerPublishTime,
      }));
      
      cachedHeadlines = { headlines };
      cacheHeadlinesTimestamp = now;
      return cachedHeadlines;
    }
    
    return cachedHeadlines || fallbackData;
  } catch (error) {
    console.error('Error fetching dynamic headlines:', error);
    return cachedHeadlines || fallbackData;
  }
}
