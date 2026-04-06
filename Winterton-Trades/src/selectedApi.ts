import type {
  PortfolioChartResponse,
  StatsResponse,
  UptimeResponse,
  RecentTrade,
  RecentTradesResponse,
  TradeHistoryResponse,
  MarketIndicesResponse,
  HeadlinesResponse,
} from './types/apiTypeDefinitions'
import { getApiSource } from './apiSource'
import * as frontendApi from './api'
import * as trueApi from './trueAPI'

function activeApi() {
  return getApiSource() === 'true-api' ? trueApi : frontendApi
}

export async function fetchStats(portfolio?: string): Promise<StatsResponse> {
  return activeApi().fetchStats(portfolio)
}

export async function fetchPortfolioChart(portfolio?: string): Promise<PortfolioChartResponse> {
  return activeApi().fetchPortfolioChart(portfolio)
}

export async function fetchRecentTrades(portfolio?: string): Promise<RecentTradesResponse> {
  return activeApi().fetchRecentTrades(portfolio)
}

export function generateRecentTrade(portfolio?: string): RecentTrade {
  return activeApi().generateRecentTrade(portfolio)
}

export async function fetchTradeHistory(
  count: number = 150,
  timeWindowMs: number = 30 * 24 * 60 * 60 * 1000,
  portfolio?: string,
): Promise<TradeHistoryResponse> {
  return activeApi().fetchTradeHistory(count, timeWindowMs, portfolio)
}

export async function fetchUptime(portfolio?: string): Promise<UptimeResponse> {
  return activeApi().fetchUptime(portfolio)
}

export async function fetchMarketIndices(portfolio?: string): Promise<MarketIndicesResponse> {
  return activeApi().fetchMarketIndices(portfolio)
}

export async function fetchTopHeadlines(): Promise<HeadlinesResponse> {
  return activeApi().fetchTopHeadlines()
}

export async function updateModelParameters(params: unknown): Promise<{ success: boolean; message: string }> {
  return activeApi().updateModelParameters(params)
}
