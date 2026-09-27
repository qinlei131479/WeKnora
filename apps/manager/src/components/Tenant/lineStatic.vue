<template>
  <div
    ref="echartsRef"
    class="echarts"
    :style="{ width: '100%', height: '100%' }"
  ></div>
</template>
<script setup>
import { locale, t } from '@/i18n';
import * as echarts from "echarts";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const echartsRef = ref();

let myChart = null;

const state = reactive({
  chartsData: [],
  option: {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '2%',
      right: '0.3%',
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    legend: {
      data: [t('component.tenant.calls', '调用次数')],
      show: false,
    },
    color: ["#6397FF"],
    xAxis: {
      type: "category",
      data: [t('component.tenant.shirts', '衬衫'), t('component.tenant.sweaters', '羊毛衫'), t('component.tenant.chiffonBlouses', '雪纺衫'), t('component.tenant.trousers', '裤子'), t('component.tenant.highHeels', '高跟鞋'), t('component.tenant.socks', '袜子')],
      axisLabel: {
        color: "#8A8C9D",
        margin: 16
      },
      axisLine: {
        lineStyle: {
          color: "#B6B9BF",
        },
      },
      axisTick: {
        show: false, // 设置x轴刻度不显示
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#8A8C9D",
      },
      splitLine: {
        // 控制网格线样式
        lineStyle: {
          color: "#E6E6EC", // 设置网格线颜色
        },
      },
    },
    dataZoom: [
    {
        start: 0,
        end: 70,
        bottom: 13,
        height: '16px',
        backgroundColor: "#F4F7FB;",
        zoomLock: true,
        brushSelect: false,
        fillerColor: "rgba(99, 151, 255, 0.2)",
        showDetail: false,
        borderRadius: 0
      },
    ],
    series: [
      {
        name: t('component.tenant.calls', '调用次数'),
        type: "line",
        data: [5, 20, 36, 10, 10, 20],
        smooth: true,
        symbolSize: 8,
      },
    ],
  },
});

// 获取echarts的x轴数据
const getXAxisData = () => {
  let xAxisList = [];
  state.chartsData.forEach((item) => {
    xAxisList.push(item.name);
  });
  return xAxisList;
};

const getSeriesData = () => {
  let seriesList = [];
  state.chartsData.forEach((item) => {
    seriesList.push({
      value: item.value,
    });
  });
  return seriesList;
};
const initEcharts = async () => {
  state.option.xAxis.data = getXAxisData();
  const seriesData = getSeriesData();
  state.option.series[0].data = seriesData;
  myChart = echarts.init(echartsRef.value);
  myChart.setOption(state.option);
  nextTick(() => {
    setTimeout(() => {
      myChart.resize();
    }, 10);
  });
};
watch(
  () => props.data,
  () => {
    initEcharts();
  }
);
watchEffect(() => {
  state.chartsData = props.data;
});
watch(locale, () => {
  const name = t('component.tenant.calls', '调用次数');
  state.option.legend.data = [name];
  state.option.series[0].name = name;
  myChart?.setOption({ legend: { data: [name] }, series: [{ name }] });
});
onMounted(() => {
  if (state.chartsData.length > 0) {
    initEcharts();
  }
});
</script>
