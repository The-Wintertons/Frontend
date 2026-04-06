export type ApiSource = 'true-api' | 'frontend-api'

let currentApiSource: ApiSource = 'frontend-api'

export function setApiSource(source: ApiSource): void {
  currentApiSource = source
}

export function getApiSource(): ApiSource {
  return currentApiSource
}
