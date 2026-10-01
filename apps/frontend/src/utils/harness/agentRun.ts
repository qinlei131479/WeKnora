interface MainChatRun {
  status?: string
  run_type?: string
  source?: string
}

export const isSteerableMainChatRun = (run: MainChatRun) =>
  run?.status === 'running' && run?.run_type === 'chat' && run?.source === 'chat'
