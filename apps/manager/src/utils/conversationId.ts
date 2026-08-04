function randomBase64(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** 会话 ID，同一对话内保持不变，格式：cid + Base64 */
export function generateConversationId(): string {
  return `sid${randomBase64(32)}`
}

/** 单次请求 ID，每次发送消息时重新生成，格式：msg + Base64 */
export function generateRequestId(): string {
  return `rid${randomBase64(16)}`
}
