<template>
  <div class="brain-card">
    <div class="brain-card-content">
      <div class="brain-card-left">
        <div class="h-full">
          <div class="flex-column">
            <div class="info-area">
              <div class="info-area-0 flex justify-between items-start">
                <div class="info-0-0 flex items-center">
                  <div class="info-avatar">
                    <span class="relative z-10">{{ agent.name.substring(0, 1) }}</span>
                    <span class="absolute inset-0 bg-white/10 animate-pulse"></span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 class="agent-name tracking-tight transition-colors">
                        {{ agent.name }}</h3>
                    </div>
                    <div class="flex items-center">
                      <el-tag class="category-name">{{ dv.categoryName }}</el-tag>
                      <span class="creator-name truncate">Creator: {{ agent.createBy }}</span>
                    </div>
                  </div>
                </div>
                <div class="info-0-1">
                  <el-tag v-if="agent.status == 1" type="success" @click="changeToOffline"
                    class="status-tag">已上线</el-tag>
                  <el-tooltip v-else content="点击可上线该业务半脑">
                    <el-tag type="info" @click="changeToOnline" class="status-tag">未上线</el-tag>
                  </el-tooltip>
                  <Delete class="delete-icon" @click="handleDelete" />
                  <!-- <el-tooltip content="删除该业务半脑">
                  </el-tooltip> -->
                </div>
              </div>
              <div class="info-area-1 info-desc">
                <el-tooltip :content="agent.description" placement="top" popper-class="tooltip-middle">
                  {{ agent.description }}
                </el-tooltip>
              </div>
            </div>

            <div class="left-bottom">
              <el-button class="test-btn" type="primary" @click="handleTest" round>
                <svg-icon icon-class="mp-test" />对话测试
              </el-button>
              <router-link v-if="$auth.hasPermi('agentic:brain:edit')" :to="`/agentic/brain/edit?id=${agent.id}`"
                class="edit-link">
                <el-button class="edit-btn" round>
                  <svg-icon icon-class="mp-manage" />
                  参数配置
                </el-button>
              </router-link>
              <el-button v-else disabled class="edit-btn no-permission" round>
                <svg-icon icon-class="mp-manage" />
                参数配置
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="sep-line"></div>
      <div class="brain-card-right">
        <div class="right-content">
          <el-scrollbar>
            <div class="right-title">
              能力
            </div>
            <div class="right-scard-grid">
              <div class="right-scard" v-for="skill in dv.skills" :key="skill.id">
                <svg-icon icon-class="mp-skill" class="scard-icon" />
                <div class="scard-name-list">
                  <g-text class="scard-name" :content="skill.name" short>{{ skill.name }}</g-text>
                  <g-text class="scard-desc" :content="skill.description" short>{{ skill.description }}</g-text>
                </div>
              </div>
            </div>
            <div class="right-title">
              知识
            </div>
            <div class="right-scard-grid">
              <div class="right-scard" v-for="knowledge in dv.knowledges" :key="knowledge.id">
                <svg-icon icon-class="mp-skill" class="scard-icon" />
                <div class="scard-name-list">
                  <g-text class="scard-name" :content="knowledge.name" short>{{ knowledge.name }}</g-text>
                  <g-text class="scard-desc" :content="knowledge.description" short>{{ knowledge.description }}</g-text>
                </div>
              </div>
            </div>
            <!-- <div class="right-scard-row">
              <div class="right-scard">
                <div class="scard-icon scard-icon-4"></div>
                <div class="scard-name-list">
                  <div class="scard-name">访问数据源</div>
                  <div class="scard-desc">数据接入与查询</div>
                </div>
              </div>
              <div class="right-scard">
                <div class="scard-icon scard-icon-5"></div>
                <div class="scard-name-list">
                  <div class="scard-name">绑定外设工具</div>
                  <div class="scard-desc">外部工具集成</div>
                </div>
              </div>
            </div> -->
          </el-scrollbar>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">

// import {
//   Search, Plus, CheckCircle2, Bot, Loader2, MessageSquare, Trash,
//   BrainCircuit, Settings2, Zap, Calendar, BookOpen, Database, Wrench,
//   Cpu, Layers, Send
// } from 'lucide-vue-next'
// import Button from '@/components/ui/Button.vue'
// import { isDomainMatch, getFlatDomains } from '@/lib/domain-store'
import type { AgentBrainEntity, CategoryVO } from '@/types'
import { offlineAgentBrainApi, onlineAgentBrainApi } from '@/api/agentic/agentBrain';
import DomainServiceFactory, { businessCategoryId } from '@/service/domainService'

const { proxy } = getCurrentInstance();

interface Prop {
  agent: AgentBrainEntity
  service?: any
}
const props = withDefaults(defineProps<Prop>(), {
  agent: () => ({} as AgentBrainEntity),
  service: () => DomainServiceFactory()
})
const emit = defineEmits(['test', 'delete'])
const agent = computed(() => {
  return props.agent
});
const dv = computed(() => {
  const agent: AgentBrainEntity = props.agent || {};
  const categoryId = agent.categoryId;
  const service = props.service;
  const categoryItem: CategoryVO | undefined = service.dataMap[categoryId]
  const categoryName = categoryItem?.name || ''
  const modelName = ''
  const modelDescription = ''
  const skills = agent.skills || []
  const knowledges = agent.knowledges || []
  // const capabilityCount = agent.skills?.length || 0
  // const taskCount = agent.tasks?.length || 0
  // const knowledgeCount = agent.knowledges?.length || 0
  // const dataCount = agent.datasources?.length || 0
  // const toolCount = agent.tools?.length || 0
  return {
    categoryName,
    modelName,
    modelDescription,
    skills,
    knowledges,
    // capabilityCount,
    // taskCount,
    // knowledgeCount,
    // dataCount,
    // toolCount
  }
});

const changeToOffline = () => {
  proxy.$modal.confirm('该业务半脑关联了交互终端，若下线该业务半脑，关联智能体将失效，请谨慎下线。点击即可下线该业务半脑').then(function () {
    doChangeStatusOffline()
  }).catch(() => { })
}
const doChangeStatusOffline = () => {
  offlineAgentBrainApi(props.agent.id).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess('下线成功')
      agent.value.status = 0
    }
  })
}


const changeToOnline = () => {
  // proxy.$modal.confirm('该业务半脑关联了交互终端，若下线该业务半脑，关联智能体将失效，请谨慎下线。点击即可下线该业务半脑').then(function () {
  // }).catch(() => { })
  doChangeStatusOnline()
}
const doChangeStatusOnline = () => {
  onlineAgentBrainApi(props.agent.id).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess('上线成功')
      agent.value.status = 1
    }
  })
}
// const getDomainLabel = (domainId: string) => {
//   const flat = getFlatDomains()
//   const found = flat.find((f) => f.id === domainId)
//   return found ? found.label : '公共分类'
// }

const handleDelete = () => {
  emit('delete', props.agent)
}
const handleTest = () => {
  emit('test', props.agent)
}
</script>
<style scoped lang="scss">
.brain-card {
  background: #FFFFFF;
  border-radius: 24px;
  opacity: 0.8;
  // padding: 32px;
  position: relative;
  overflow: hidden;
}

.brain-card-content {
  position: relative;
  margin: 32px;
  display: flex;
  min-width: 0;
  // flex-direction: column;
  // gap: 32px;
  justify-content: space-between;
  overflow: hidden;

  .brain-card-left {
    flex: 1 0 50%;
    overflow: hidden;
    padding-right: 32px;
    // margin-right: 32px;
  }

  .sep-line {
    width: 1px;
    background-color: #E1E6EC;
    flex-grow: 0;
    flex-shrink: 0;
    // margin: 0 32px;
  }

  .brain-card-right {
    flex: 1 0 50%;
    overflow: hidden;
    padding-left: 32px;
  }
}

.brain-card-left {
  .flex-column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    width: 100%;
  }

  .info-area-0 {
    width: 100%;
    margin-bottom: 20px;
    min-width: 0;
  }

  .info-desc {
    height: 60px;
    overflow: hidden;
    font-size: 14px;
    color: #B0BAC6;
    line-height: 1.5;
  }

  .info-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: #FFFFFF;
    border-radius: 40px;
    width: 80px;
    height: 80px;
    background: linear-gradient(180deg, #31ABA0 0%, #2897BE 100%);
    box-shadow: 0px 3px 6px 1px #B0DFE3;
    position: relative;
    margin-right: 20px;
    flex-shrink: 0;
  }

  .agent-name {
    font-size: 20px;
    color: #2B2F33;
    font-weight: bold;
    line-height: 1.5;
  }

  .category-name {
    background: #F5F5FF;
    border-radius: 20px 20px 20px 20px;
    border: 1px solid #ADAADF;
    font-size: 12px;
    color: #2015B9;
    margin-right: 12px;
  }

  .creator-name {
    font-weight: bold;
    font-size: 14px;
    color: #77838F;
  }

  .status-tag {
    border-radius: 20px;
    cursor: pointer;
  }

  .delete-icon {
    width: 16px;
    height: 16px;
    margin-left: 20px;
    display: inline-block;
    cursor: pointer;

    &:hover {
      color: var(--el-color-danger);
    }
  }

  .left-bottom {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    min-width: 0;
    width: 100%;
  }

  .test-btn {
    flex-grow: 1;
  }

  .edit-link {
    flex-grow: 1;
  }

  .edit-btn {
    flex-grow: 1;
    width: 100%;
  }
}

.brain-card-right {
  .right-content {
    height: 212px;
    overflow: auto;
  }

  .right-title {
    font-weight: bold;
    font-size: 16px;
    color: #2B2F33;
    line-height: 22px;
    margin-bottom: 12px;
  }

  .right-scard-row {
    display: flex;
    gap: 20px;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    width: 100%;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .right-scard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 20px;
    margin-bottom: 12px;
  }

  .right-scard {
    flex: 1 0 50%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    // height: 72px;
    padding: 12px 20px;
    overflow: hidden;
    background: rgba(235, 243, 245, 0.6);
    border-radius: 16px;

    .scard-icon {
      width: 24px;
      height: 24px;
      margin-right: 8px;
      background-size: 100% 100%;
      flex-shrink: 0;
      color: var(--el-color-primary);
    }

    .scard-name-list {
      flex-grow: 1;
      overflow: hidden;
      min-width: 0;

      .scard-name {
        height: 24px;
        line-height: 24px;
        font-weight: bold;
        font-size: 16px;
        color: #2B2F33;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .scard-desc {
        font-size: 14px;
        color: #77838F;
        line-height: 20px;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    // .scard-icon-0 {
    //   background-image: url('@/assets/images/brain/icon.0.png');
    // }

    // .scard-icon-1 {
    //   background-image: url('@/assets/images/brain/icon.1.png');
    // }

    // .scard-icon-2 {
    //   background-image: url('@/assets/images/brain/icon.2.png');
    // }

    // .scard-icon-3 {
    //   background-image: url('@/assets/images/brain/icon.3.png');
    // }

    // .scard-icon-4 {
    //   background-image: url('@/assets/images/brain/icon.4.png');
    // }

    // .scard-icon-5 {
    //   background-image: url('@/assets/images/brain/icon.5.png');
    // }
  }
}
</style>
