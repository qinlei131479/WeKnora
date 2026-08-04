export const BASE_URL = '/dev-api';
export const AGENT_URL = '/agentic';
export const AGENT_BRAIN_URL = '/agentBrain';
export const wrapData = (data: any, message: string = 'success', code: number = 200) => {
  return {
    code: code,
    msg: message,
    data: JSON.parse(JSON.stringify(data))
  }
}
export const wrapTableData = (data: any[], total: number, message: string = 'success', code: number = 200) => {
  return {
    code: code,
    msg: message,
    rows: JSON.parse(JSON.stringify(data)),
    total: total
  }
}