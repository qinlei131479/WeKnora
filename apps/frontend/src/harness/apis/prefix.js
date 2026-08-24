export const HARNESS_API_PREFIX = '/harness-api'

export function harnessUrl(url) {
  if (typeof url !== 'string' || !url) return url
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith(HARNESS_API_PREFIX)) {
    return url
  }
  if (url.startsWith('/api')) {
    return `${HARNESS_API_PREFIX}${url}`
  }
  return url
}
