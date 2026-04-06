import type {
  PortfolioChartResponse,
  StatsResponse,
  UptimeResponse,
  RecentTrade,
  RecentTradesResponse,
  TradeHistoryResponse,
  TradeRecord,
  TradeStatus,
  MarketIndicesResponse,
  HeadlinesResponse,
} from './types/apiTypeDefinitions'

export const STRATEGY_NAMES = ['mean_reversion', 'mlmc_strategy'] as const
export type StrategyName = (typeof STRATEGY_NAMES)[number]

const DEFAULT_PORTFOLIO: StrategyName = 'mean_reversion'

// Configure this to Caleb's static IP (for example: http://123.45.67.89)
const TRUE_API_BASE_URL = (import.meta.env.VITE_TRUE_API_BASE_URL as string | undefined)?.trim() || 'http://999.999.999.999'

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function getPortfolio(portfolio?: string): string {
  const candidate = (portfolio ?? '').trim()
  if (candidate.length === 0) return DEFAULT_PORTFOLIO

  const normalized = candidate.toLowerCase()
  if (normalized === 'main portfolio' || normalized === 'stocks') return 'mean_reversion'
  if (normalized === 'crypto') return 'mlmc_strategy'
  if (normalized === 'mean_reversion' || normalized === 'mlmc_strategy') return normalized

  return DEFAULT_PORTFOLIO
}

function apiUrl(path: string, query: Record<string, string | number | undefined> = {}): string {
  const base = normalizeBaseUrl(TRUE_API_BASE_URL)
  const route = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}/api${route}`)

  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && `${v}`.length > 0) {
      url.searchParams.set(k, `${v}`)
    }
  }

  return url.toString()
}

async function fetchJson<T>(path: string, query: Record<string, string | number | undefined> = {}, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path, query), {
    method: 'GET',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed (${response.status} ${response.statusText}) for ${path}`)
  }

  return (await response.json()) as T
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) return 0

  let normalized = value

  // Handle decimal ratios provided as 0..1.
  if (normalized > 0 && normalized <= 1) {
    normalized *= 100
  }

  // Handle whole-percent values accidentally scaled by 100 (e.g. 400 => 4%).
  if (normalized > 100 && normalized <= 10000) {
    normalized /= 100
  }

  return Math.min(100, Math.max(0, normalized))
}

function parsePercent(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return normalizePercent(value)
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('%', '').trim())
    if (Number.isFinite(parsed)) {
      return normalizePercent(parsed)
    }
  }

  return normalizePercent(fallback)
}

function formatPercent(value: number): string {
  return `${normalizePercent(value).toFixed(3)}%`
}

function formatUsd(value: number): string {
  if (value >= 1) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return `$${value.toFixed(4)}`
}

function isTradeStatus(value: unknown): value is TradeStatus {
  return value === 'Filled' || value === 'Partial' || value === 'Cancelled'
}

function toTradeRecord(raw: unknown, index: number): TradeRecord {
  const row = (raw ?? {}) as Record<string, unknown>
  const price = asNumber(row.price, 0)
  const quantity = asNumber(row.quantity, 0)

  const type = row.type === 'Sell' ? 'Sell' : 'Buy'
  const status = isTradeStatus(row.status) ? row.status : 'Filled'

  const totalFromPayload = asNumber(row.total, Number.NaN)
  const computedTotal = Number.isFinite(totalFromPayload) ? totalFromPayload : price * quantity

  return {
    id: asNumber(row.id, index + 1),
    date: asString(row.date, ''),
    time: asString(row.time, ''),
    pair: asString(row.pair, 'N/A'),
    type,
    price,
    quantity,
    total: Math.round(computedTotal * 100) / 100,
    status,
  }
}

function toRecentTrade(record: TradeRecord): RecentTrade {
  return {
    time: record.time,
    pair: record.pair,
    type: record.type,
    price: formatUsd(record.price),
  }
}

function parseTradeTimestamp(record: TradeRecord): number {
  const timestamp = Date.parse(`${record.date} ${record.time}`)
  return Number.isFinite(timestamp) ? timestamp : 0
}

export async function fetchStats(portfolio?: string): Promise<StatsResponse> {
  type BackendStats = {
    lifetimeReturns?: string
    solvency?: string
    timeSinceLastTrade?: string
  }

  const data = await fetchJson<BackendStats>('/getSummaryStats', { portfolio: getPortfolio(portfolio) })

  return {
    lifetimeReturns: asString(data.lifetimeReturns, '0%'),
    solvency: asString(data.solvency, '0%'),
    timeSinceLastTrade: asString(data.timeSinceLastTrade, 'N/A'),
  }
}

export async function fetchPortfolioValue(date: string, portfolio?: string): Promise<{ time: string; value: number }> {
  type BackendPortfolioValue = {
    time?: string
    value?: number
  }

  const data = await fetchJson<BackendPortfolioValue>('/getPortfolioValue', {
    Date: date,
    portfolio: getPortfolio(portfolio),
  })

  return {
    time: asString(data.time, date),
    value: asNumber(data.value, 0),
  }
}

export async function fetchPortfolioChart(portfolio?: string): Promise<PortfolioChartResponse> {
  type BackendPortfolioValues = {
    data?: Array<{ time?: string; value?: number }>
  }

  const data = await fetchJson<BackendPortfolioValues>('/getPortfolioValues', { portfolio: getPortfolio(portfolio) })

  return {
    data: (data.data ?? [])
      .map((point) => ({
        time: asString(point.time, ''),
        value: asNumber(point.value, 0),
      }))
      .filter((point) => point.time.length > 0),
  }
}

export async function fetchTradeHistory(
  count: number = 150,
  _timeWindowMs: number = 30 * 24 * 60 * 60 * 1000,
  portfolio?: string,
): Promise<TradeHistoryResponse> {
  type BackendTradeRecordResponse = {
    trades?: unknown[]
  }

  const data = await fetchJson<BackendTradeRecordResponse>('/getTradeRecord', { portfolio: getPortfolio(portfolio) })
  const trades = (data.trades ?? []).map((trade, idx) => toTradeRecord(trade, idx))

  trades.sort((a, b) => parseTradeTimestamp(b) - parseTradeTimestamp(a))

  const sliced = trades.slice(0, Math.max(0, count))

  return {
    trades: sliced,
    totalCount: trades.length,
  }
}

export async function fetchRecentTrades(portfolio?: string): Promise<RecentTradesResponse> {
  const history = await fetchTradeHistory(10, undefined, portfolio)
  return {
    trades: history.trades.map(toRecentTrade),
  }
}

export function generateRecentTrade(portfolio?: string): RecentTrade {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour12: false })
  const strategy = getPortfolio(portfolio)
  const pair = strategy === 'mlmc_strategy' ? 'ETH/USDT' : 'BTC/USDT'
  const basePrice = strategy === 'mlmc_strategy' ? 2400 : 43000
  const jitter = basePrice * (Math.random() * 0.004 - 0.002)
  const price = basePrice + jitter

  return {
    time,
    pair,
    type: Math.random() >= 0.5 ? 'Buy' : 'Sell',
    price: formatUsd(price),
  }
}

export async function fetchUptime(_portfolio?: string): Promise<UptimeResponse> {
  type BackendPeriod = { value?: number }
  type BackendCumulative = {
    uptimePercent?: string | number
    UptimePeriods?: number[]
    uptimePeriods?: number[]
  }

  const portfolio = getPortfolio(_portfolio)

  const [periodData, cumulativeData] = await Promise.all([
    fetchJson<BackendPeriod>('/getUptimePeriod', { portfolio }),
    fetchJson<BackendCumulative>('/getCumulativeUptime', { portfolio }),
  ])

  const periodValues = cumulativeData.UptimePeriods ?? cumulativeData.uptimePeriods ?? []
  const normalizedPeriodValues = periodValues
    .map((v) => Math.min(100, Math.max(0, asNumber(v, 0))))

  const withCurrent = normalizedPeriodValues.length > 0
    ? normalizedPeriodValues
    : [Math.min(100, Math.max(0, asNumber(periodData.value, 0)))]

  const statusBars = withCurrent.map((value) => ({
    value,
    color: value === 100 ? '#26a69a' : value > 80 ? '#ffc107' : '#ef5350',
  }))

  const responseTimeline = withCurrent.map((uptimeValue) => {
    const base = 180 + (100 - uptimeValue) * 4
    const noise = (Math.random() - 0.5) * 20
    return Math.max(40, Math.round((base + noise) * 100) / 100)
  })

  const avgMs = responseTimeline.length > 0
    ? responseTimeline.reduce((sum, item) => sum + item, 0) / responseTimeline.length
    : 0

  const periodAverage = withCurrent.length > 0
    ? withCurrent.reduce((sum, item) => sum + item, 0) / withCurrent.length
    : 0

  return {
    uptimePercent: formatPercent(parsePercent(cumulativeData.uptimePercent, periodAverage)),
    avgResponseTime: `${avgMs.toFixed(2)}ms`,
    statusBars,
    responseTimeline,
  }
}

let cachedIndices: MarketIndicesResponse | null = null
let cacheTimestamp = 0
const CACHE_DURATION_MS = 60000

export async function fetchMarketIndices(_portfolio?: string): Promise<MarketIndicesResponse> {
  const now = Date.now()
  if (cachedIndices && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedIndices
  }

  const fallbackData: MarketIndicesResponse = {
    indices: [
      { symbol: 'SPX', name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'DJI', name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'IXIC', name: 'API Error', value: 0, change: 0, changePercent: 0 },
      { symbol: 'RUT', name: 'API Error', value: 0, change: 0, changePercent: 0 },
    ],
  }

  try {
    const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT']
    const responses = await Promise.all(
      symbols.map(async (sym) => {
        const res = await fetch(`/fin-api/v8/finance/chart/${sym}?interval=1d&range=1d`)
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        return res.json() as Promise<{ chart?: { result?: Array<{ meta?: Record<string, unknown> }> } }>
      }),
    )

    const indices = responses.reduce<MarketIndicesResponse['indices']>((acc, data) => {
      const meta = data.chart?.result?.[0]?.meta
      if (!meta) return acc

      let symbol = asString(meta.symbol, 'N/A')
      let name = asString(meta.shortName, symbol)

      if (symbol === '^GSPC') {
        symbol = 'SPX'
        name = 'S&P 500'
      }
      if (symbol === '^DJI') {
        symbol = 'DJI'
        name = 'Dow Jones'
      }
      if (symbol === '^IXIC') {
        symbol = 'IXIC'
        name = 'NASDAQ'
      }
      if (symbol === '^RUT') {
        symbol = 'RUT'
        name = 'Russell 2000'
      }

      const price = asNumber(meta.regularMarketPrice, 0)
      const prevClose = asNumber(meta.chartPreviousClose, asNumber(meta.previousClose, price))
      const change = price - prevClose
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

      acc.push({
        symbol,
        name,
        value: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
      })

      return acc
    }, [])

    if (indices.length === 0) {
      return cachedIndices ?? fallbackData
    }

    cachedIndices = { indices }
    cacheTimestamp = now
    return cachedIndices
  } catch (error) {
    console.error('Error fetching market indices:', error)
    return cachedIndices ?? fallbackData
  }
}

let cachedHeadlines: HeadlinesResponse | null = null
let cacheHeadlinesTimestamp = 0
const CACHE_HEADLINES_DURATION_MS = 60000

export async function fetchTopHeadlines(): Promise<HeadlinesResponse> {
  const now = Date.now()
  if (cachedHeadlines && now - cacheHeadlinesTimestamp < CACHE_HEADLINES_DURATION_MS) {
    return cachedHeadlines
  }

  const fallbackData: HeadlinesResponse = { headlines: [] }

  try {
    const res = await fetch('/fin-api/v1/finance/search?q=finance&newsCount=10')
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = (await res.json()) as { news?: Array<Record<string, unknown>> }

    if (!Array.isArray(data.news)) {
      return cachedHeadlines ?? fallbackData
    }

    const headlines = data.news.map((item) => ({
      uuid: asString(item.uuid, ''),
      title: asString(item.title, ''),
      publisher: asString(item.publisher, ''),
      link: asString(item.link, ''),
      providerPublishTime: asNumber(item.providerPublishTime, 0),
    })).filter((item) => item.uuid.length > 0 && item.title.length > 0)

    cachedHeadlines = { headlines }
    cacheHeadlinesTimestamp = now

    return cachedHeadlines
  } catch (error) {
    console.error('Error fetching headlines:', error)
    return cachedHeadlines ?? fallbackData
  }
}

export async function updateModelParameters(params: unknown): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchJson<{ success?: boolean; message?: string }>(
      '/updateModelParameters',
      {},
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
    )

    return {
      success: Boolean(response.success),
      message: asString(response.message, 'Model parameters updated'),
    }
  } catch (error) {
    console.error('updateModelParameters failed:', error)
    return {
      success: false,
      message: 'Failed to update model parameters',
    }
  }
}
