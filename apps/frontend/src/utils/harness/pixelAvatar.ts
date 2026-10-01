// 内网打不开 api.dicebear.com，头像改用本地 SVG，颜色与浅色主题色板一致。
const AVATAR_FILL_COLORS = ['#049b38', '#9581cc', '#1890ff', '#d48806', '#cf1322']

export const AVATAR_BACKGROUND_TOKENS = [
  { background: 'linear-gradient(135deg, var(--main-600), var(--color-info-500))', color: '#fff' },
  {
    background: 'linear-gradient(135deg, var(--chart-palette-5), var(--chart-palette-9))',
    color: '#fff'
  },
  {
    background: 'linear-gradient(135deg, var(--chart-palette-7), var(--chart-palette-3))',
    color: '#fff'
  },
  {
    background: 'linear-gradient(135deg, var(--color-accent-500), var(--chart-palette-6))',
    color: '#fff'
  },
  {
    background: 'linear-gradient(135deg, var(--chart-palette-4), var(--color-error-500))',
    color: '#fff'
  }
]

const normalizeSeed = (id: unknown) => {
  if (id === null || id === undefined || String(id).trim() === '') {
    throw new Error('generatePixelAvatar requires an id')
  }
  return String(id).trim()
}

const escapeSvgText = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

export const generatePixelAvatar = (id: unknown) => {
  const seed = normalizeSeed(id)
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  }
  const fill = AVATAR_FILL_COLORS[hash % AVATAR_FILL_COLORS.length]
  const label = escapeSvgText(Array.from(seed).slice(0, 1).join('') || '智')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${fill}"/><text x="32" y="42" text-anchor="middle" font-size="28" font-family="sans-serif" fill="#ffffff">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const getAvatarInitials = (name: unknown, kind: string = 'user') => {
  const fallback = kind === 'agent' ? '智能' : '用户'
  const normalizedName = String(name || '').trim()
  if (!normalizedName) return fallback
  return Array.from(normalizedName).slice(0, 2).join('')
}

export const getAvatarColorIndex = (seed: unknown) => {
  const normalizedSeed = String(seed || '').trim()
  const value = normalizedSeed || 'avatar'
  let hash = 0
  for (const char of value) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  }
  return hash % AVATAR_BACKGROUND_TOKENS.length
}

export const getAvatarFallbackStyle = (seed: unknown) => AVATAR_BACKGROUND_TOKENS[getAvatarColorIndex(seed)]
