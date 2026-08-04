<template>
  <transition :name="transitionName">
    <div class="center-model CenterModel" v-show="modelVisible">
      <div class="mask" @click="close"></div>
      <div class="center-model-dialog" :style="dialogStyle">
        <slot></slot>
        <div v-if="!hideCloseBtn" class="close-box" @click="close">
          <slot name="close">
            <img class="close-btn" :src="closeImg" />
          </slot>
        </div>
        <div v-if="$slots.btns" class="btns-box">
          <slot name="btns"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import closeImg from "@/assets/img/player/close.png";
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    beforeMaskClose: Function,
    hideCloseBtn: {
      type: Boolean,
      default: false,
    },
    width: String,
    height: String,
    transitionName: {
      type: String,
      default: "center-model",
    },
  },
  computed: {
    // modelClass() {
    //   return {
    //     'hide': !this.modelVisible,
    //   }
    // },
    dialogStyle() {
      var style = {};
      if (this.width) {
        style.width = this.width;
      }
      if (this.height) {
        style.height = this.height;
      }
      return style;
    },
  },
  data() {
    return {
      closeImg,
      modelVisible: this.visible,
    };
  },
  methods: {
    close() {
      if (this.beforeMaskClose) {
        this.beforeMaskClose(() => {
          this.modelVisible = false;
          this.$emit("update:visible", false);
        });
      } else {
        this.modelVisible = false;
        this.$emit("update:visible", false);
      }
    },
    invoke(name) {
      this.invokeTargetChildren(this, name);
    },
    invokeTargetChildren(target, name) {
      var children = target.$children;
      if (!children) return;
      children.forEach((child) => {
        var method = child[name];
        if (typeof method == "function") {
          try {
            child[name]();
          } catch (e) {
            console.error(e);
          }
        }
        this.invokeTargetChildren(child, name);
      });
    },
  },
  watch: {
    visible: {
      handler(newValue) {
        this.modelVisible = newValue;
        this.invoke(newValue ? "onModelShow" : "onModelHide");
      },
      immediate: true,
    },
  },
};
</script>

<style lang="less">
.center-model {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 9;

  .mask {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: #000;
    opacity: 0.5;
  }

  .center-model-dialog {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    width: 50%;
    height: 50%;
    margin: auto;
    background: #fff;
    transition: all 3s;
  }

  .close-box {
    position: absolute;
    top: -20px;
    right: -20px;
    cursor: pointer;
    width: 40px;
    height: 40px;
  }

  .close-btn {
    width: 100%;
    height: 100%;
  }

  .btns-box {
    position: absolute;
    top: 50px;
    right: -151px;
  }
}

// .center-model.center-model-enter {
//   .center-model-dialog {
//     width: 0 !important;
//     height: 0 !important;
//     .video-box {
//       height: 0 !important;
//     }
//   }
// }
// .center-model-enter-active{

// }
.center-model-enter-active,
.center-model-leave-active {
  transition: opacity 0.28s;
}

.center-model-enter,
.center-model-leave-active {
  opacity: 0;
}
</style>

