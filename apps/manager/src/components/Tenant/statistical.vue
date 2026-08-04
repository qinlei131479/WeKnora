<template>
  <div class="statisticalCard">
    <div v-if="props.isShowImg" class="statisticalCard_icon">
      <img src="../../assets/images/static.png" />
    </div>
    <div>
      <div class="statisticalCard_txt">累计调用</div>
      <div class="statisticalCard_num">
        {{
          props.data?.calledTimes || props.data.calledTimes == 0
            ? (props.data?.calledTimes).toLocaleString()
            : "- -"
        }}<span style="font-size: 14px; color: #8a8c9d; margin-left: 8px"
          >次</span
        >
      </div>
    </div>
    <div class="line"></div>
    <div>
      <div class="statisticalCard_txt">剩余</div>
      <div class="statisticalCard_num">
        {{
          props.data?.remainCalledTimes || props.data.remainCalledTimes == 0
            ? (props.data?.remainCalledTimes).toLocaleString()
            : "- -"
        }}<span style="font-size: 14px; color: #8a8c9d; margin-left: 8px"
          >次</span
        >
      </div>
    </div>
    <div class="line"></div>
    <div>
      <div class="statisticalCard_txt">有效时间</div>
      <div class="statisticalCard_num">
        {{
          props.tenantInfo?.auditServiceValidityStart &&
          props.tenantInfo?.auditServiceValidityEnd
            ? props.tenantInfo?.auditServiceValidityStart + " ~ " + props.tenantInfo?.auditServiceValidityEnd
            : "- -"
        }}
      </div>
    </div>
  </div>
</template>

<script setup name="statistical">
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
  isShowImg: {
    type: Boolean,
    default: true,
  },
  tenantInfo: {
    type: Object,
    default: {},
  },
});
</script>

<style lang="less" scoped>
.statisticalCard {
  display: flex;
  justify-content: end;
  align-items: center;
  .statisticalCard_txt {
    font-family: 思源黑体 CN;
    font-weight: 0;
    font-size: 14px;
    color: #8a8c9d;
    text-align: left;
    font-style: normal;
    text-transform: none;
    margin-bottom: 12px;
  }
  .line {
    width: 2px;
    height: 52px;
    background: #e6e6ec;
    margin: 0 20px;
  }
  .statisticalCard_num_gray {
    color: #88909a;
    font-size: 36px;
    text-align: left;
  }
  .statisticalCard_num {
    font-family: 思源黑体 CN;
    font-weight: 500;
    font-size: 24px;
    color: #0c113d;
    text-align: left;
    font-style: normal;
    text-transform: none;
    margin-right: 20px;
  }
  .statisticalCard_icon {
    margin-right: 12px;
    img {
      width: 40px;
      height: 40px;
    }
  }
}
</style>
