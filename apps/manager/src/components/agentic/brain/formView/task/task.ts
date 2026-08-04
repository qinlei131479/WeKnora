import { AgentBrainTaskCalenderItem, AgentBrainTaskItem } from "@/types"

export interface CalendarDayTasks extends AgentBrainTaskCalenderItem {
  list: AgentBrainTaskItem[] // 任务列表, 最多显示3个任务
  more: boolean // 是否有更多任务
  moreList?: AgentBrainTaskItem[] // 更多任务列表
}

export interface MemtionItem {
  id?: number;
  type?: any;
  name: string;
  dataId: string;
}

export interface TreeData extends MemtionItem {
  // name: string;
  // dataId: string;
  sname: string;
  label: string;
  checked: boolean;
  children?: TreeData[];
  type: typeof DataTypes[keyof typeof DataTypes];
  typeName: string;
  treeId: string;
  parentId?: string | number;
  deptId?: any;
}

export const DataTypes = {
  DEPT: '1',
  POSITION: '2',
  USERGROUP: '3',
  USER: '0',
}

export const allId = -1;

export const ExecTypes = Object.freeze({
  Never: 0,
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
  Yearly: 4,
});
export const EndExecTypes = Object.freeze({
  Never: 0,
  Date: 1,
})


const userHistoryListKey = 'memtion-user-history-list'
const deptHistoryListKey = 'memtion-dept-history-list'
const positionHistoryListKey = 'memtion-position-history-list'
const userGroupHistoryListKey = 'memtion-user-group-history-list'
const toMemtionItem = (item: TreeData) => ({
  id: item.id,
  type: item.type,
  name: item.name,
  dataId: item.dataId,
})
export class HistoryManage {
  userHistoryList: MemtionItem[] = []
  deptHistoryList: MemtionItem[] = []
  positionHistoryList: MemtionItem[] = []
  userGroupHistoryList: MemtionItem[] = []
  constructor() {
    this.userHistoryList = []
    this.deptHistoryList = []
    this.positionHistoryList = []
    this.userGroupHistoryList = []
    this.init()
  }
  init() {
    const userHistoryList = sessionStorage.getItem(userHistoryListKey)
    if (userHistoryList) {
      this.userHistoryList = JSON.parse(userHistoryList)
    }
    const deptHistoryList = sessionStorage.getItem(deptHistoryListKey)
    if (deptHistoryList) {
      this.deptHistoryList = JSON.parse(deptHistoryList)
    }
    const positionHistoryList = sessionStorage.getItem(positionHistoryListKey)
    if (positionHistoryList) {
      this.positionHistoryList = JSON.parse(positionHistoryList)
    }
    const userGroupHistoryList = sessionStorage.getItem(userGroupHistoryListKey)
    if (userGroupHistoryList) {
      this.userGroupHistoryList = JSON.parse(userGroupHistoryList)
    }
  }
  add(item: TreeData) {
    if (item.type === DataTypes.USER) {
      if (item.id === allId) {
        return
      }
      this.userHistoryList = this.userHistoryList.filter((i) => i.dataId !== item.dataId)
      this.userHistoryList.unshift(toMemtionItem(item))
      sessionStorage.setItem(userHistoryListKey, JSON.stringify(this.userHistoryList))
    } else if (item.type === DataTypes.DEPT) {
      this.deptHistoryList = this.deptHistoryList.filter((i) => i.dataId !== item.dataId)
      this.deptHistoryList.unshift(toMemtionItem(item))
      sessionStorage.setItem(deptHistoryListKey, JSON.stringify(this.deptHistoryList))
    } else if (item.type === DataTypes.POSITION) {
      this.positionHistoryList = this.positionHistoryList.filter((i) => i.dataId !== item.dataId)
      this.positionHistoryList.unshift(toMemtionItem(item))
      sessionStorage.setItem(positionHistoryListKey, JSON.stringify(this.positionHistoryList))
    } else if (item.type === DataTypes.USERGROUP) {
      this.userGroupHistoryList = this.userGroupHistoryList.filter((i) => i.dataId !== item.dataId)
      this.userGroupHistoryList.unshift(toMemtionItem(item))
      sessionStorage.setItem(userGroupHistoryListKey, JSON.stringify(this.userGroupHistoryList))
    }
  }
  get(){
    return [
      ...this.userHistoryList,
      ...this.deptHistoryList,
      ...this.positionHistoryList,
      ...this.userGroupHistoryList
    ]
  }
}