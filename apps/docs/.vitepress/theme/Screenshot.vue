<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  /** 相对站点根的图片路径，约定放在 public/screenshots/ 下 */
  src: string
  /** 图注：说明这张图展示的是什么 */
  caption: string
  /** 补充说明：截图应覆盖哪些界面元素，供补图的人参考 */
  hint?: string
}>()

// 图片可能尚未补充。默认先渲染占位框，只有确实加载成功才换成图片，
// 这样缺图时不会先闪一个碎图标再降级。
const loaded = ref(false)
const resolved = computed(() => withBase(props.src))
</script>

<template>
  <figure class="wk-shot">
    <button
      v-show="loaded"
      type="button"
      class="wk-shot-frame"
      :aria-label="`放大查看：${caption}`"
      title="点击放大"
    >
      <span class="wk-shot-stage">
        <img
          class="wk-shot-img"
          :src="resolved"
          :alt="caption"
          @load="loaded = true"
        />
      </span>
      <span class="wk-shot-hint" aria-hidden="true">点击放大</span>
    </button>
    <div v-if="!loaded" class="wk-shot-placeholder">
      <div class="wk-shot-placeholder-badge">截图待补充</div>
      <div class="wk-shot-placeholder-caption">{{ caption }}</div>
      <p v-if="hint" class="wk-shot-placeholder-hint">{{ hint }}</p>
      <code class="wk-shot-placeholder-path">apps/docs/public{{ src }}</code>
    </div>
    <figcaption class="wk-shot-caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.wk-shot {
  margin: 36px 0;
}

/* 灰阶舞台 + 浮起阴影：浅色截图在白底上也能分清边界（Apple 产品图展示方式） */
.wk-shot-frame {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 22px;
  overflow: hidden;
  background: var(--wk-shot-stage);
  cursor: zoom-in;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 24px 48px rgba(0, 0, 0, 0.08);
  transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.35s ease;
}

.wk-shot-frame:hover {
  transform: scale(1.008);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 8px 20px rgba(0, 0, 0, 0.06),
    0 32px 64px rgba(0, 0, 0, 0.1);
}

.wk-shot-stage {
  display: block;
  padding: clamp(16px, 3vw, 28px);
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.55), transparent 55%),
    linear-gradient(180deg, #ececf1 0%, #e3e3e8 100%);
}

.dark .wk-shot-stage {
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.04), transparent 55%),
    linear-gradient(180deg, #2c2c2e 0%, #1d1d1f 100%);
}

.wk-shot-img {
  display: block;
  width: 100%;
  vertical-align: top;
  border-radius: 12px;
  background: #fff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 10px 28px rgba(0, 0, 0, 0.1);
}

.dark .wk-shot-img {
  background: #1d1d1f;
}

.wk-shot-hint {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 7px 12px;
  border-radius: 980px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #fff;
  background: rgba(29, 29, 31, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  pointer-events: none;
}

.wk-shot-frame:hover .wk-shot-hint {
  opacity: 1;
  transform: none;
}

.wk-shot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed var(--wk-rule);
  border-radius: 22px;
  background: var(--wk-paper-2);
}

.wk-shot-placeholder-badge {
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 12px;
  line-height: 20px;
  color: var(--wk-ink-soft);
  background: var(--wk-paper-3);
}

.wk-shot-placeholder-caption {
  font-size: 15px;
  font-weight: 600;
  color: var(--wk-ink);
}

.wk-shot-placeholder-hint {
  max-width: 46em;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--wk-ink-soft);
}

.wk-shot-placeholder-path {
  font-size: 12px;
  color: var(--wk-ink-mute);
}

.wk-shot-caption {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--wk-ink-mute);
}
</style>
