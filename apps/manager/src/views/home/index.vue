<template>
  <div class="ai-dashboard-container default-bg">
    <div class="home-main">
      <el-row :gutter="16" class="top-card-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-left">
              <div class="stat-title">AI资产总量</div>
              <div class="stat-value">{{ topData.assetCount || 0 }} <span class="text-unit">项</span></div>
              <div class="stat-desc">较昨日 <span v-if="topData.assetCountChange > 0" class="text-green">+{{
                topData.assetCountChange }}</span><span v-else-if="topData.assetCountChange < 0" class="text-red">{{
                    topData.assetCountChange }}</span><span v-else>0</span>
                项
              </div>
            </div>
            <div class="stat-icon bg-cyan">
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-left">
              <div class="stat-title">资产复用率</div>
              <div class="stat-value">{{ topData.assetReuseRate || 0 }} <span class="text-unit">%</span></div>
              <div class="stat-desc">较昨日 <span v-if="topData.assetReuseRateChange > 0" class="text-green">+{{
                topData.assetReuseRateChange }}%</span><span v-else-if="topData.assetReuseRateChange < 0"
                  class="text-red">{{ topData.assetReuseRateChange }}%</span> <span v-else>0</span></div>
            </div>
            <div class="stat-icon bg-green">
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-left">
              <div class="stat-title">活跃智能体数</div>
              <div class="stat-value">{{ topData.agenticActiveCount || 0 }} <span class="text-unit">个</span></div>
              <div class="stat-desc">总智能体 {{ topData.agenticCount || 0 }}</div>
            </div>
            <div class="stat-icon bg-blue">
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-left">
              <div class="stat-title">服务用户数</div>
              <div class="stat-value">{{ topData.userUseCount || 0 }} <span class="text-unit">人</span></div>
              <div class="stat-desc">较昨日 <span v-if="topData.userUseCountChange > 0" class="text-green">+{{
                topData.userUseCountChange }}</span><span v-else-if="topData.userUseCountChange < 0"
                  class="text-red">{{ topData.userUseCountChange }}</span><span v-else>0</span></div>
            </div>
            <div class="stat-icon bg-orange">
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 中部主体区域 AI资产 + 拓扑图 + 智能体 -->
      <div class="middle-area">
        <div class="middle-bg middle-bg-left"></div>
        <div class="middle-bg middle-bg-right"></div>
        <div class="middle-content">
          <div class="middle-left">
            <h3 class="center-title center-title-left">AI资产</h3>
            <div class="cl-row" @click="goModel">
              <div class="cl-icon cl-icon-0">
                <svg-icon icon-class="mp-model" class="svg-icon-0" />
              </div>
              <div class="cl-name">大语言模型</div>
              <div class="cl-tip">
                <el-tooltip :content="assetNames.model" :disabled="!assetNames.model" placement="top">
                  {{ assetNames.model }}
                </el-tooltip>
              </div>
            </div>
            <div class="cl-row" @click="goTool">
              <div class="cl-icon cl-icon-1">
                <svg-icon icon-class="mp-tool" class="svg-icon-1" />
              </div>
              <div class="cl-name">插件工具</div>
              <div class="cl-tip">
                <el-tooltip :content="assetNames.tool" :disabled="!assetNames.tool" placement="top">
                  {{ assetNames.tool }}
                </el-tooltip>
              </div>
            </div>
            <div class="cl-row" @click="goSkill">
              <div class="cl-icon cl-icon-2">
                <svg-icon icon-class="mp-skill" class="svg-icon-2" />
              </div>
              <div class="cl-name">技能组合</div>
              <div class="cl-tip">
                <el-tooltip :content="assetNames.skill" :disabled="!assetNames.skill" placement="top">
                  {{ assetNames.skill }}
                </el-tooltip>
              </div>
            </div>
            <div class="cl-row" @click="goKnowledge">
              <div class="cl-icon cl-icon-3">
                <svg-icon icon-class="mp-knowledge" class="svg-icon-3" />
              </div>
              <div class="cl-name">专属知识库</div>
              <div class="cl-tip">
                <el-tooltip :content="assetNames.knowledge" :disabled="!assetNames.knowledge" placement="top">
                  {{ assetNames.knowledge }}
                </el-tooltip>
              </div>
            </div>
            <div class="cl-row" @click="goDataSource">
              <div class="cl-icon cl-icon-4">
                <svg-icon icon-class="mp-db" class="svg-icon-4" />
              </div>
              <div class="cl-name">数据连接</div>
              <div class="cl-tip">
                <el-tooltip :content="assetNames.dataSource" :disabled="!assetNames.dataSource" placement="top">
                  {{ assetNames.dataSource }}
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="middle-center"></div>
          <div class="middle-right">
            <h3 class="center-title center-title-right">智能体</h3>
            <el-scrollbar class="cr-card-list">
              <div class="cr-card" v-for="item in categoryItems" :key="item.key">
                <div class="agent-block">
                  <div class="agent-domain">
                    <div class="domain-icon domain-icon-0">{{ item.char }}</div>
                    <span class="domain-name">{{ item.name }}</span>
                  </div>
                  <div class="domain-desc">{{ item.desc }}</div>
                  <div class="agent-btn-group">
                    <div class="agent-btn" v-for="agent in item.items" :key="agent.key" @click="goAgent(agent)">{{ agent.name }}
                    </div>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <div class="bottom-row">
        <!-- 智能体运行状态 环形图 -->
        <div class="bottom-item b-0">
          <div class="bottom-card">
            <h3 class="card-title">智能体运行状态</h3>
            <div ref="pieRef" class="pie-chart"></div>
          </div>
        </div>

        <!-- 今日运行概况 -->
        <div class="bottom-item b-1">
          <div class="bottom-card">
            <h3 class="card-title">今日运行概况</h3>
            <div class="overview-grid">
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">今日对话次数</div>
                  <div class="overview-value">{{ formatNumber(todayData?.chatCount || 0) }} <span class="unit">次</span>
                  </div>
                </div>
                <div class="overview-right s0"></div>
              </div>
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">对话总时长</div>
                  <div class="overview-value">{{ formatNumber(todayData?.duration || 0) }} <span class="unit">秒</span>
                  </div>
                </div>
                <div class="overview-right s1"></div>
              </div>
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">数据源调用次数</div>
                  <div class="overview-value">{{ formatNumber(todayData?.dataSourceCount || 0) }} <span
                      class="unit">次</span>
                  </div>
                </div>
                <div class="overview-right s2"></div>
              </div>
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">工具调用次数</div>
                  <div class="overview-value">{{ formatNumber(todayData?.toolCount || 0) }} <span class="unit">次</span>
                  </div>
                </div>
                <div class="overview-right s0"></div>
              </div>
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">能力调用次数</div>
                  <div class="overview-value">{{ formatNumber(todayData?.skillCount || 0) }} <span class="unit">次</span>
                  </div>
                </div>
                <div class="overview-right s1"></div>
              </div>
              <div class="overview-item">
                <div class="overview-left">
                  <div class="overview-label">知识库调用次数</div>
                  <div class="overview-value">{{ formatNumber(todayData?.knowledgeCount || 0) }} <span
                      class="unit">次</span>
                  </div>
                </div>
                <div class="overview-right s2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 风险中心 -->
        <div class="bottom-item b-2">
          <div class="bottom-card risk-card">
            <h3 class="card-title">风险中心</h3>
            <div class="risk-list">
              <el-scrollbar>
                <div class="risk-item" v-for="(item, index) in errorItems"
                  :key="item.name + '-' + item.errorTime + '-' + index" @click="handleRistClick(item)">
                  <div class="risk-row risk-row-0">
                    <img src="@/assets/images/home/warn.icon.png" alt="风险图标" class="risk-icon">
                    <div class="risk-title text-red">{{ item.name }}</div>
                    <div class="risk-time">{{ parseTime(item.errorTime, '{h}:{i}:{s}') }}</div>
                  </div>
                  <div class="risk-row risk-row-1">
                    <div class="risk-placeholder-0"></div>
                    <el-tooltip :content="item.description" placement="top">
                      <div class="risk-desc">{{ item.description }}</div>
                    </el-tooltip>
                    <div class="risk-tag" :class="{ 'text-red': item.handleFlag === 0 }">{{ item.handleFlag === 0 ? '未处理'
                      :
                      '已处理' }}</div>
                  </div>
                </div>
              </el-scrollbar>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

import {
  getHomeAgenticStatusApi,
  getHomeErrorItemsApi,
  getHomeAssetApi,
  getHomeTodayDataApi,
  getHomeTopDataApi,
} from '@/api/home/home'
import { CategoryVO, HomeAgenticStatus, HomeAsset, HomeCategory, HomeErrorItem, HomeTodayData, HomeTopData } from '@/types'

interface AssetNames {
  model: string;
  tool: string;
  skill: string;
  knowledge: string;
  dataSource: string;
}
interface DomainItem {
  key: string;
  id: string;
  categoryId: number;
  name: string;
}
interface CategoryItem {
  key: string;
  name: string;
  desc: string;
  char: string;
  items: DomainItem[]
}
const topData = ref<HomeTopData>({});
const todayData = ref<HomeTodayData>({});
const agenticStatus = ref<HomeAgenticStatus>({});
const errorItems = ref<HomeErrorItem[]>([]);
// const assetData = ref<HomeAsset>({});
const assetNames = ref<AssetNames>({
  model: '',
  tool: '',
  skill: '',
  knowledge: '',
  dataSource: '',
});
const categoryItems = ref<CategoryItem[]>([]);

const router = useRouter();
const goModel = () => {
  router.push('/resources/models')
}
const goTool = () => {
  router.push('/resources/tools')
}
const goSkill = () => {
  router.push('/resources/skills')
}
const goKnowledge = () => {
  router.push('/knowledge/square')
}
const goDataSource = () => {
  router.push('/dataservices/datasources')
}
const goAgent = (item: DomainItem) => {
  router.push(`/agentic/brainlist?domain=${item.categoryId}`)
}
const handleRistClick = (item: HomeErrorItem) => {
  // router.push(`/home/riskdetail?id=${item.id}`)
}

// 千分位格式化数字
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
};

const pieRef = ref<HTMLDivElement>()
let pieChart: echarts.ECharts | null = null

// 环形饼图 智能体状态
const initPie = () => {
  if (!pieRef.value) return
  if (!pieChart) {
    pieChart = echarts.init(pieRef.value)
  }
  const { legendData, percentData, seriesData, total } = buildPieChartData();
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 50,
      itemGap: 20,
      data: legendData,
      formatter: (name: string) => {
        return `${name} ${percentData[name]}%`
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `总计\n${total}`,
          fontSize: 16
        },
        data: seriesData,
        // data: [
        //   { value: 89.47, name: '正常', itemStyle: { color: '#289c9c' } },
        //   { value: 5.26, name: '异常', itemStyle: { color: '#f2994a' } },
        //   { value: 5.26, name: '停用', itemStyle: { color: '#d0d7dc' } }
        // ]
      }
    ]
  }
  pieChart.setOption(option)
}

const buildPieChartData = () => {
  const formatDecimal = (num: number) => {
    const str = num.toFixed(2).replace(/0+$/, '').replace(/\.+$/, '');
    return str;
  }
  const agenticStatusValue: HomeAgenticStatus = agenticStatus.value || {} as HomeAgenticStatus
  const legendData = ['正常', '异常', '停用']
  const percentData: Record<string, string> = {
    正常: '',
    异常: '',
    停用: '',
  }
  const seriesData = [
    { value: 0, name: '正常', itemStyle: { color: '#289c9c' } },
    { value: 0, name: '异常', itemStyle: { color: '#f2994a' } },
    { value: 0, name: '停用', itemStyle: { color: '#d0d7dc' } }
  ]
  let normalCount = agenticStatusValue.normalCount || 0
  let abnormalCount = agenticStatusValue.abnormalCount || 0
  let disabledCount = agenticStatusValue.disabledCount || 0
  let total = normalCount + abnormalCount + disabledCount
  percentData.正常 = formatDecimal(normalCount / total * 100)
  percentData.异常 = formatDecimal(abnormalCount / total * 100)
  percentData.停用 = formatDecimal(disabledCount / total * 100)
  seriesData[0].value = normalCount
  seriesData[1].value = abnormalCount
  seriesData[2].value = disabledCount
  return { legendData, percentData, seriesData, total }
}
const loadTopData = () => {
  getHomeTopDataApi().then(res => {
    topData.value = res.data || {}
  })
}

const loadAssetData = () => {
  getHomeAssetApi().then(res => {
    const data: HomeAsset = res.data || {} as HomeAsset
    assetNames.value = {
      model: data.agiModelList?.map((item: any) => item.name).join('/') || '',
      tool: data.toolList?.map((item: any) => item.name).join('/') || '',
      skill: data.skillList?.map((item: any) => item.name).join('/') || '',
      knowledge: data.knowledgeList?.map((item: any) => item.name).join('/') || '',
      dataSource: data.dataSourceList?.map((item: any) => item.name).join('/') || '',
    }
    const categoryItemsValue: CategoryItem[] = data.categoryList?.map((item: HomeCategory, index: number) => {
      const name = item.categoryName || ''
      const char = name.substring(0, 1)
      const newItem = {
        key: `${name}--${index}`,
        name: name,
        desc: name,
        char: char,
        items: item.agenticList?.map((item: any) => ({ categoryId: item.categoryId, id: item.id, name: item.name, key: `${item.id}_${item.name}` })) || [],
      }
      if (newItem.items.length > 4) {
        newItem.items.length = 4
      }
      return newItem
    }) || []
    // if (categoryItemsValue.length > 2) {
    //   categoryItemsValue.length = 2
    // }
    categoryItems.value = categoryItemsValue
  })
}

const loadErrorItems = () => {
  getHomeErrorItemsApi().then(res => {
    const data: HomeErrorItem[] = res.data || []
    // if (data.length > 2) {
    //   data.length = 2
    // }
    errorItems.value = data
  })
}

const loadAgenticStatus = () => {
  return getHomeAgenticStatusApi().then(res => {
    agenticStatus.value = res.data || {}
  })
}

const loadTodayData = () => {
  getHomeTodayDataApi().then(res => {
    todayData.value = res.data || {}
  })
}

const resizeHandler = () => {
  pieChart?.resize()
}

loadTopData()
loadAssetData()
loadErrorItems()
loadTodayData()
const agenticStatusPromise = loadAgenticStatus()
onMounted(async () => {
  window.addEventListener('resize', resizeHandler)
  await nextTick()
  await agenticStatusPromise
  initPie()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  pieChart?.dispose()
})
</script>

<style scoped lang="scss">
.ai-dashboard-container {
  height: 100%;
  overflow: auto;

  .home-main {
    margin: auto;
    padding: 40px;
    background-image: url('@/assets/images/home/bg.png');
    background-size: 100% 100%;
    width: 1680px;
    height: 984px;
    overflow: hidden;
  }
}

.text-green {
  color: #29B276;
}

.text-red {
  color: #F34848;
}

.top-card-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  box-shadow: 0px 4px 8px 1px rgba(50, 151, 160, 0.1);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .stat-left {
    text-align: left;

    .stat-title {
      font-size: 14px;
      color: #2B2F33;
      line-height: 20px;
    }

    .stat-value {
      font-weight: bold;
      font-size: 32px;
      color: #2B2F33;
      line-height: 46px;
      margin-top: 8px;
    }

    .stat-desc {
      font-size: 14px;
      color: #77838F;
      line-height: 20px;
      margin-top: 8px;
    }

    .text-unit {
      font-size: 14px;
      color: #77838F;
      line-height: 20px;
    }
  }

  .stat-icon {
    width: 72px;
    height: 72px;
    // border-radius: 10px;
    // display: flex;
    // align-items: center;
    // justify-content: center;
    // font-size: 24px;
    // color: white;
    background-size: 100% 100%;

    &.bg-cyan {
      background-image: url('@/assets/images/home/top.0.png');
    }

    &.bg-green {
      background-image: url('@/assets/images/home/top.1.png');
    }

    &.bg-blue {
      background-image: url('@/assets/images/home/top.2.png');
    }

    &.bg-orange {
      background-image: url('@/assets/images/home/top.3.png');
    }
  }
}

.middle-area {
  position: relative;
  height: 450px;
  overflow: hidden;

  .middle-bg {
    position: absolute;
    inset: 0;
    width: 420px;
    border-radius: 24px;
    opacity: 0.8;
  }

  .middle-bg-left {
    background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
    right: auto;
  }

  .middle-bg-right {
    background: linear-gradient(to left, #ffffff, rgba(255, 255, 255, 0));
    left: auto;
  }
}

.middle-content {
  position: relative;
  height: 100%;
  overflow: auto;
  margin-bottom: 20px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .middle-left {
    flex: 1 0 23.75%;
    min-width: 0;
  }

  .middle-center {
    flex: 1 0 46.55%;
  }

  .middle-right {
    flex: 1 0 23.75%;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .cr-card-list {
    flex: 1;
    min-height: 0;
  }

  .center-title {
    font-weight: bold;
    font-size: 20px;
    color: #2B2F33;
    line-height: 29px;
    margin-bottom: 20px;
  }

  .center-title-left {
    text-align: right;
  }

  .cl-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    // line-height: 56px;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 12px 16px;
    font-size: 14px;
    min-width: 0;
    cursor: pointer;

    .cl-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cl-icon-0 {
      background: #EBF3F5;
      color: var(--el-color-primary);
    }

    .cl-icon-1 {
      background: #F5F5FF;
      color: #5349c9;
    }

    .cl-icon-2 {
      background: #FFF9F2;
      color: #ffb969;
    }

    .cl-icon-3 {
      background: #ECFBF5;
      color: #64c89d;
    }

    .cl-icon-4 {
      background: rgba(94, 166, 239, 0.1);
      color: #65aaf0;
    }

    .svg-icon {
      width: 24px;
      height: 24px;
    }

    .cl-name {
      flex-grow: 1;
      min-width: 0;
      flex-shrink: 0;
      font-weight: bold;
      color: #2B2F33;
      margin-left: 12px;
      margin-right: 10px;
    }

    .cl-tip {
      color: #77838F;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.cr-card {
  background: #FFFFFF;
  border-radius: 16px 16px 16px 16px;
  height: 165px;

  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }

  .agent-block {
    padding: 16px 20px;

    .agent-domain {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      font-weight: 600;
      margin-bottom: 4px;

      .domain-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #FFFFFF;
        border-radius: 99px;
      }

      .domain-icon-0 {
        background: #3297A0;
      }

      .domain-icon-1 {
        background: #2015B9;
      }

      .domain-name {
        font-weight: bold;
        font-size: 14px;
        color: #2B2F33;
        line-height: 20px;
      }
    }

    .domain-desc {
      font-size: 12px;
      color: #B0BAC6;
    }

    .agent-btn-group {
      margin-top: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;

      .agent-btn {
        background: #EBF3F5;
        border-radius: 8px 8px 8px 8px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: #2B2F33;
        line-height: 32px;
        cursor: pointer;
      }
    }
  }
}

.bottom-row {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 20px;
  min-width: 0;
  height: 264px;
  .bottom-item {
    height: 100%;
    min-width: 0;
  }

  .b-0 {
    flex: 0 0 25%;
  }

  .b-1 {
    flex-grow: 1;
  }

  .b-2 {
    flex: 0 0 25%;
  }

  .bottom-card {
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 24px 24px 24px 24px;
    height: 100%;
    overflow: hidden;
  }
  .risk-card {
    display: flex;
    flex-direction: column;
    .card-title {
      flex-shrink: 0;
    }
    .risk-list {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }
  }

  .card-title {
    font-weight: bold;
    font-size: 16px;
    color: #2B2F33;
    line-height: 24px;
  }
}

.pie-chart {
  height: 216px;
  width: 100%;
}

.overview-grid {
  margin-top: 21px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  // gap: 12px;

  .overview-item {
    width: 232px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;

    .overview-label {
      font-size: 14px;
      color: #77838F;
      line-height: 20px;
    }

    .overview-value {
      font-weight: bold;
      font-size: 20px;
      color: #2B2F33;
      line-height: 29px;

      .unit {
        font-weight: 400;
        font-size: 14px;
        color: #77838F;
        line-height: 20px;
      }
    }

    .overview-right {
      width: 88px;
      height: 40px;
      background-size: 100% 100%;

      &.s0 {
        background-image: url('@/assets/images/home/b0.png');
      }

      &.s1 {
        background-image: url('@/assets/images/home/b1.png');
      }

      &.s2 {
        background-image: url('@/assets/images/home/b2.png');
      }
    }
  }
}

.risk-list {
  margin-top: 20px;

  .risk-item {
    padding: 12px;
    background: rgba(243, 72, 72, 0.05);
    border-radius: 16px 16px 16px 16px;

    &+.risk-item {
      margin-top: 16px;
    }

    .risk-row {
      display: flex;
      align-items: center;
      min-width: 0;

      .risk-icon {
        width: 24px;
        height: 24px;
        margin-right: 2px;
      }

      .risk-title {
        flex-grow: 1;
        font-weight: bold;
        font-size: 14px;
        // color: #F34848;
        line-height: 20px;
        margin-right: auto;
      }

      .risk-time {
        font-weight: 400;
        font-size: 14px;
        color: #77838F;
        line-height: 20px;
      }


      .risk-placeholder-0 {
        flex-shrink: 0;
        width: 26px;
      }

      .risk-desc {
        flex-grow: 1;
        font-weight: 400;
        font-size: 14px;
        color: #77838F;
        line-height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .risk-tag {
        font-weight: 400;
        font-size: 14px;
        // color: #F34848;
        line-height: 20px;
        flex-shrink: 0;
      }
    }
  }
}
</style>