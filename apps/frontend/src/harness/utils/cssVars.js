export function getHarnessRoot() {
  return document.querySelector('.harness-root') || document.documentElement
}

export function getCSSVariable(variableName, element = getHarnessRoot()) {
  return getComputedStyle(element).getPropertyValue(variableName).trim()
}
