export const NEW_CHAT_ROUTE_NAMES = new Set(['kbCreatChat', 'globalCreatChat', 'chatWorkCreat'])

export function isNewChatRouteName(name: unknown): boolean {
  return typeof name === 'string' && NEW_CHAT_ROUTE_NAMES.has(name)
}
