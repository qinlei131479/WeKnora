<script setup lang="ts">
import { User as UserIcon, Search, X, ChevronDown, Check, Database, Save } from 'lucide-vue-next'
import { Search as SearchIcon, ArrowDown as ArrowDownIcon } from '@element-plus/icons-vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'


import { getByUserId } from '@/api/knowledge/knowledgeRole'
import { getUserAuditApi } from '@/api/knowledgeLib/knowledgeAuth'
import { listUser, getUser } from '@/api/system/user'
// import { AuthTypes, updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'
import { AjaxResult, BusinessRoleEntity, KnowledgeAuthEntity, KnowledgeAuthSingleSave, SysUser, UserQueryParams } from '@/types'

interface RowUser extends SysUser {
  userIdStr: string
  checked: boolean
}

const positionData = ref<RowUser[]>([])
const positionDataMap = ref<Record<string, RowUser>>({})
const selectedPositionId = ref('')
const currentUser = ref<RowUser>(null)

const toThinItem = (item: SysUser): RowUser => {
  return {
    userId: item.userId,
    userIdStr: item.userId + '',
    userName: item.userName,
    nickName: item.nickName || item.userName,
    remark: item.remark,
    checked: false,
    dept: item.dept,
    postIds: item.postIds,
  }
}
const getPositionData = async () => {
  const params: UserQueryParams = {
    pageSize: 999,
    pageNum: 1,
    status: '0'
  };
  await listUser(params).then(res => {
    const rootItems: RowUser[] = [];
    const dataMap: Record<string, RowUser> = {};
    (res.rows || []).forEach((item: SysUser) => {
      const thinItem = toThinItem(item)
      rootItems.push(thinItem)
      dataMap[thinItem.userId!] = thinItem
    });
    positionDataMap.value = dataMap
    positionData.value = rootItems
  })
}

const userGroups = ref<BusinessRoleEntity[]>([])
const getUserGroups = () => {
  userGroups.value = [];
  const userId = currentUser.value?.userIdStr || ''
  getByUserId(userId).then((res: AjaxResult<BusinessRoleEntity[]>) => {
    userGroups.value = res.data || []
  })
};
interface UserDetail {
  data: SysUser
  postNames: string[]
}
const userDetail = ref<UserDetail>({})
const getUserDetail = () => {
  const userId = currentUser.value?.userId
  getUser(userId).then((res: AjaxResult) => {
    console.log('getUserDetail', res)
    const data: UserDetail = res.data || {}
    userDetail.value = { ...data }
  })
}



const auditSearchQuery = ref('')
const total = ref(0)
const tableData = ref<KnowledgeAuthEntity[]>([])
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
})

const initRightData = async () => {
  await getPositionData();
  selectedPositionId.value = positionData.value[0]?.userIdStr || ''
}

const getTableDatas = () => {
  const userId = selectedPositionId.value
  if (!userId) {
    total.value = 0
    tableData.value = []
    return;
  }
  const params = {
    userId: userId,
    keyword: auditSearchQuery.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  }
  getUserAuditApi(params).then(res => {
    total.value = +res.total || 0
    tableData.value = res.rows || []
  })
}

const handleSearch = () => {
  if (searchDelayTimer) {
    clearTimeout(searchDelayTimer)
    searchDelayTimer = null
  }
  getTableDatas()
}

const toggleAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  //   const value = (kb as any)[flag];
  //   const params: KnowledgeAuthSingleSave = {
  //     knowledgeId: kb.knowledgeId!,
  //     authId: selectedPositionId.value,
  //     authType: AuthTypes.DEPT,
  //     [flag]: value,
  //   }
  //   return updateKnowledgeAuthApi(params).then((res) => {
  //     if (res.code != 200) {
  //       getTableDatas()
  //     }
  //   },()=>{
  //     getTableDatas()
  //   })
}

initRightData()

watch(
  () => selectedPositionId.value,
  (newVal: string) => {
    if (!newVal) {
      return;
    }
    const positionItem = positionDataMap.value[newVal]
    currentUser.value = positionItem
    getTableDatas()
    getUserGroups()
    getUserDetail()
  }
)
let searchDelayTimer: any = null;
watch(
  () => auditSearchQuery.value,
  (newVal: string) => {
    if (searchDelayTimer) {
      clearTimeout(searchDelayTimer)
    }
    searchDelayTimer = setTimeout(() => {
      searchDelayTimer = null
      getTableDatas()
    }, 800)
  }
)


</script>
<template>
  <page-layout gap="20">
    <template #start>
      <div class="top-card">
        <div class="top-card-layout">
          <div class="top-card-left">
            <svg-icon icon-class="mp-user" />
          </div>
          <div class="top-card-middle">
            <div class="top-card-text0">
              独立用户视角下的沙箱通达性及全矩阵审计
            </div>
            <div class="top-card-text1">
              选择系统任一在册职员，可对该对象基于多维组织标签(部门、职位、团队)合成后的最终通达级别进行深度安全穿透核验。
            </div>
          </div>
          <div class="top-card-right">
            <label class="top-card-right-label">
              在册审核职员对象
            </label>
            <el-select-v2 v-model="selectedPositionId" filterable :options="positionData" :props="{
              label: 'nickName',
              value: 'userIdStr',
            }" :item-height="50" placeholder="输入姓名检索...">
              <template #prefix>
                <el-icon>
                  <SearchIcon />
                </el-icon>
              </template>
              <template #default="{ item }">
                <!-- <span style="margin-right: 8px">{{ item.userName }}</span>
                <span style="color: var(--el-text-color-secondary); font-size: 13px">
                  {{ item.userIdStr }}
                </span> -->
                <div :class="[
                  'p-2.5 flex items-start gap-2.5 cursor-pointer text-xs transition-colors',
                  item.userIdStr === selectedPositionId ? 'bg-blue-50/80 text-blue-800' : 'hover:bg-slate-50 text-slate-700'
                ]">
                  <div :class="[
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                    item.userIdStr === selectedPositionId ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'
                  ]">
                    {{ item.nickName.substring(0, 1) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 justify-between">
                      <span class="font-bold truncate">{{ item.nickName }}</span>
                      <span class="text-[10px] font-mono text-slate-400 truncate shrink-0">{{ item.userName }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 flex flex-wrap items-center gap-1 mt-0.5">
                      <span
                        class="font-medium inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px]">
                        🏢 {{ item.dept?.deptName || '无' }}
                      </span>
                      <span
                        class="font-medium inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px]">
                        <!-- 🎭 {{ positions.find(p => p.id === u.positionId)?.title || '无' }} -->
                      </span>
                    </div>
                  </div>
                  <Check v-if="item.userIdStr === selectedPositionId"
                    class="w-3.5 h-3.5 text-blue-600 shrink-0 self-center" />
                </div>
              </template>
            </el-select-v2>
          </div>
        </div>
        <!-- <div class="top-inner-card">
          <div class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">岗位主要职责详情</div>
          <div class="font-semibold text-slate-700 block">{{ selectedPosition?.remark || '' }}&nbsp;</div>
        </div> -->
      </div>
    </template>
    <page-layout gap="20">
      <template v-if="currentUser" #start>
        <div class="user-card">
          <div class="user-card-item flex items-center">
            <div class="name-point">
              {{ currentUser.nickName.substring(0, 1) }}
            </div>
            <div class="texts-area">
              <div class="text text0">{{ currentUser.nickName }}</div>
              <div class="text text1">{{ currentUser.userName }}</div>
            </div>
          </div>

          <div class="user-card-item">
            <div class="texts-area">
              <div class="text text1">所属实体部门</div>
              <div class="text text0">{{ currentUser.dept?.deptName || '无' }}</div>
            </div>
          </div>

          <div class="user-card-item">
            <div class="texts-area">
              <div class="text text1">拥有的职务岗位</div>
              <div class="text text0">{{ userDetail.postNames?.join('、') || '无岗位信息' }}</div>
            </div>
          </div>

          <div class="user-card-item">
            <div class="texts-area">
              <div class="text text1">绑定的用户组</div>
              <div class="user-tags flex flex-wrap">
                <template v-if="userGroups.length > 0">
                  <span v-for="g in userGroups" :key="g.id" class="user-tag">
                    <svg-icon icon-class="mp-group"></svg-icon>{{ g.roleName }}
                  </span>
                </template>
                <span v-else class="text1">暂无用户组</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <page-layout gap="20" class="list-card">
        <template #start>
          <div class="list-header">
            <div class="list-header-left">
              <div class="list-header-left-title">
                用户权限穿透映射矩阵
              </div>
              <div class="list-header-left-desc">展示用户在各知识库上的实际权限状态及来源</div>
            </div>

            <div class="list-header-right">
              <el-input v-model="auditSearchQuery" clearable :suffix-icon="Search"
                class="mp__search-input search-input mini" placeholder="检索知识库、ID、或分类存储域..." />
            </div>
          </div>
        </template>
        <div class="h-full overflow-auto">
          <table class="card-table">
            <thead>
              <tr>
                <th class="large-cell">实体知识库</th>
                <th class="">分类领域</th>
                <th class="">管辖权限 (MANAGE)</th>
                <th class="">问答检索权 (QUERY)</th>
                <th class="">文档下载权 (DOWNLOAD)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tableData.length === 0" class="empty-tr">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  无匹配知识库
                </td>
              </tr>
              <tr v-for="kb in tableData" :key="kb.id" class="data-tr">
                <td>
                  <div class="knowledge-item">
                    <KnowledegIcon :type="kb.knowledgeType" class="kb-card-icon" />
                    <div class="knowledge-name">{{ kb.knowledgeName }}</div>
                    <div class="knowledge-id">ID: {{ kb.knowledgeId }}</div>
                  </div>
                </td>
                <td>
                  {{ kb.categoryName }}
                </td>
                <td>
                  <el-checkbox v-model="kb.manageFlag" :true-value="1" :false-value="0" disabled
                    @change="toggleAuth(kb, 'manageFlag')" />
                </td>
                <td>
                  <el-checkbox v-model="kb.queryFlag" :true-value="1" :false-value="0" disabled
                    @change="toggleAuth(kb, 'queryFlag')" />
                </td>
                <td>
                  <el-checkbox v-model="kb.downloadFlag" :true-value="1" :false-value="0" disabled
                    @change="toggleAuth(kb, 'downloadFlag')" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </page-layout>
    </page-layout>
    <template #end>
      <pagination v-show="total > 0" :total="total" v-model:page="pageInfo.pageNum" v-model:limit="pageInfo.pageSize"
        @pagination="getTableDatas" />
    </template>
  </page-layout>
</template>
<style scoped lang="scss">
@use './tabview.scss';

.user-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px 24px 24px 24px;
  padding: 28px 32px 20px;
  display: flex;

  .user-card-item {
    flex: 1;
    border-left: 1px solid #E1E6EC;
    padding-left: 20px;

    &:first-child {
      padding-left: 0;
      border-left: none;
    }

    .name-point {
      width: 48px;
      height: 48px;
      background: #EBF3F5;
      border-radius: 50%;
      color: var(--el-color-primary);
      font-weight: bold;
      font-size: 20px;
      line-height: 48px;
      text-align: center;
    }

    .texts-area {
      margin-left: 20px;

      .text0 {
        font-size: 16px;
        color: #2B2F33;
        line-height: 24px;
      }

      .text1 {
        font-size: 14px;
        color: #B0BAC6;
        line-height: 20px;
      }
    }
  }

  .text+.text {
    margin-top: 8px;
  }

  .user-tags {
    margin-top: 8px;
    gap: 8px;

    .user-tag {
      background: #E3F3F5;
      border-radius: 8px 8px 8px 8px;
      border: 1px solid #A7CFD2;
      font-size: 14px;
      color: #3297A0;
      line-height: 20px;
      padding: 6px 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      .svg-icon {
        width: 20px;
        height: 20px;
      }
    }
  }
}
</style>
