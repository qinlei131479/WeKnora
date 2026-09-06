function dashboardRoot(): Element {
  return document.querySelector('.dashboard-page') || document.documentElement
}

export function getCSSVariable(variableName: string, element: Element = dashboardRoot()): string {
  return getComputedStyle(element).getPropertyValue(variableName).trim()
}

let colorPalette: string[] = []
let isInitialized = false

function pick(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name)
  return value && value.trim() ? value.trim() : fallback
}

function buildColorPalette() {
  try {
    const styles = getComputedStyle(dashboardRoot())
    const paletteVars: Array<[string, string]> = [
      ['--chart-palette-1', '#07c05f'],
      ['--chart-palette-2', '#5ad8a6'],
      ['--chart-palette-3', '#f6bd16'],
      ['--chart-palette-4', '#f27c7c'],
      ['--chart-palette-5', '#9581cc'],
      ['--chart-palette-6', '#6dc8ec'],
      ['--chart-palette-7', '#ff9d4d'],
      ['--chart-palette-8', '#92d050'],
      ['--chart-palette-9', '#e885ba'],
      ['--chart-palette-10', '#8c8c8c'],
    ]
    const baseVars: Array<[string, string]> = [
      ['--main-500', '#07c05f'],
      ['--color-success-500', '#52c41a'],
      ['--color-warning-500', '#faad14'],
      ['--color-error-500', '#ff4d4f'],
      ['--color-accent-500', '#13c2c2'],
    ]
    colorPalette = [...paletteVars, ...baseVars]
      .map(([name, fallback]) => pick(styles, name, fallback))
      .filter((color, index, arr) => Boolean(color) && arr.indexOf(color) === index)
    isInitialized = true
  } catch {
    colorPalette = ['#07c05f', '#5ad8a6', '#f6bd16', '#f27c7c', '#9581cc', '#6dc8ec', '#ff9d4d', '#92d050', '#e885ba', '#8c8c8c']
    isInitialized = true
  }
}

export function getColorByIndex(index: number): string {
  if (!isInitialized || colorPalette.length === 0) buildColorPalette()
  return colorPalette[index % colorPalette.length]
}

export function getColorPalette(): string[] {
  if (!isInitialized || colorPalette.length === 0) buildColorPalette()
  return [...colorPalette]
}

export function truncateLegend(name: string, maxLength = 20): string {
  if (!name) return ''
  return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name
}

export function initColorPalette() {
  isInitialized = false
  buildColorPalette()
}
