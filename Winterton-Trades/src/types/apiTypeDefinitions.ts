// ---------------------------------------------------------------------------
// Chart – Portfolio value over time
// ---------------------------------------------------------------------------

/** A single point on the portfolio-value area chart. */
export interface PortfolioDataPoint {
  /** ISO date string, e.g. "2024-01-01" */
  time: string
  /** Portfolio value in USD at closing */
  value: number
}

/** Response shape returned by the portfolio-history endpoint. */
export interface PortfolioChartResponse {
  /** Ordered array of daily portfolio values (oldest → newest) */
  data: PortfolioDataPoint[]
}

// ---------------------------------------------------------------------------
// Stats Badges
// ---------------------------------------------------------------------------

/** Response shape returned by the trading-stats endpoint. */
export interface StatsResponse {
  /** Total return since account inception, e.g. "10.42%" */
  lifetimeReturns: string
  /** Current solvency ratio expressed as a percentage, e.g. "2.1%" */
  solvency: string
  /** Human-readable time elapsed since the last trade, e.g. "2d 12h 02m" */
  timeSinceLastTrade: string
}

// ---------------------------------------------------------------------------
// Uptime Widget
// ---------------------------------------------------------------------------

/** Availability data for a single monitored period (e.g. one day). */
export interface UptimePeriod {
  /** Uptime percentage for this period, 0 – 100 */
  value: number
  /** Hex or CSS color used to render the status bar */
  /** Handled locally */
  color: string
}

/**
 * Response shape returned by the uptime/status endpoint.
 * All time-series arrays are ordered oldest → newest.
 */
export interface UptimeResponse {
  /** Rolling uptime percentage string, e.g. "99.983%" */
  uptimePercent: string
  /** Current average response time string, e.g. "221.22ms" */
  /** Handled locally. Run a ping every x amount of time, then update the average */
  avgResponseTime: string
  /** Per-period status bars for the "Last N Days" sparkbar section */
  statusBars: UptimePeriod[]
  /**
   * Raw response-time samples (in ms) used to draw the response-time
   * sparkline chart. Each entry represents one polling sample.
   * 
   * Also handled Locally
   */
  responseTimeline: number[] 
}

// ---------------------------------------------------------------------------
// Recent Trades
// ---------------------------------------------------------------------------

/** A single trade entry shown in the live recent-trades ticker. */
export interface RecentTrade {
  /** Wall-clock time of the trade, e.g. "10:32:14" (HH:MM:SS, 24-hour) */
  time: string
  /** Trading pair symbol, e.g. "BTC/USDT" */
  pair: string
  /** Direction of the trade */
  type: 'Buy' | 'Sell'
  /**
   * Formatted price string including currency symbol, e.g. "$42,183.22".
   * The backend should pre-format this so the UI can render it directly.
   */
  price: string
}

/** Response shape returned by the recent-trades endpoint. */
export interface RecentTradesResponse {
  /** Latest trades, ordered newest → oldest. UI typically shows the first 6. */
  trades: RecentTrade[]
}

// ---------------------------------------------------------------------------
// Trade History (modal)
// ---------------------------------------------------------------------------

/** Possible fill statuses for a historical trade order. */
export type TradeStatus = 'Filled' | 'Partial' | 'Cancelled'

/** A single historical trade record shown in the Trade History modal. */
export interface TradeRecord {
  /** Unique numeric order / trade identifier */
  id: number
  /** Human-readable date string, e.g. "Mar 10, 2026" */
  date: string
  /** Wall-clock time of execution, e.g. "10:32:14" (HH:MM:SS, 24-hour) */
  time: string
  /** Trading pair symbol, e.g. "BTC/USDT" */
  pair: string
  /** Direction of the trade */
  type: 'Buy' | 'Sell'
  /** Execution price in USD (raw number; UI formats for display) */
  price: number
  /** Amount of the base asset traded */
  quantity: number
  /** `price × quantity` in USD (raw number; UI formats for display) */
  total: number
  /** Fill status of the order */
  status: TradeStatus
}

/** Response shape returned by the trade-history endpoint. */
export interface TradeHistoryResponse {
  /** Full list of historical trades, ordered newest → oldest. */
  trades: TradeRecord[]
  /** Total number of trades available (for pagination, if needed later). */
  totalCount: number
}

// ---------------------------------------------------------------------------
// Market Indices
// ---------------------------------------------------------------------------

/** A single market index snapshot (e.g. S&P 500, DJIA). */
export interface MarketIndex {
  /** Ticker-like symbol, e.g. "SPX", "DJI" */
  symbol: string
  /** Human-readable index name, e.g. "S&P 500" */
  name: string
  /** Current index value */
  value: number
  /** Absolute change from previous close */
  change: number
  /** Percentage change from previous close */
  changePercent: number
}

/** Response shape returned by the market-indices endpoint. */
export interface MarketIndicesResponse {
  indices: MarketIndex[]
}

// ---------------------------------------------------------------------------
// Top Headlines
// ---------------------------------------------------------------------------

export interface TopHeadline {
  uuid: string
  title: string
  publisher: string
  link: string
  providerPublishTime: number
}

export interface HeadlinesResponse {
  headlines: TopHeadline[]
}
