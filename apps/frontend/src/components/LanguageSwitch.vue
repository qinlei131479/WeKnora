<template>
  <div class="language-switch" :class="`language-switch--${variant}`">
    <button type="button" @click="toggleLanguageMenu" :title="currentLangOption?.label">
      <span class="lang-flag-icon">{{ currentLangOption?.flag }}</span>
      <span class="link-text">{{ currentLangOption?.shortLabel }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="showLanguageMenu" class="language-dropdown">
      <div
        v-for="lang in languageOptions"
        :key="lang.value"
        class="language-option"
        :class="{ active: currentLanguage === lang.value }"
        @click="selectLanguage(lang.value)"
      >
        <span class="lang-flag">{{ lang.flag }}</span>
        <span class="lang-label">{{ lang.label }}</span>
        <span v-if="currentLanguage === lang.value" class="check-icon">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { getFeatureFlags, isAllowedLocale } from '@/utils/weknoraFeatures'
import { useEditorResourcesStore } from '@/stores/editorResources'

withDefaults(defineProps<{
  variant?: 'login' | 'topbar'
}>(), {
  variant: 'login',
})

const { t, locale } = useI18n()
const editorResources = useEditorResourcesStore()
const featureFlags = getFeatureFlags()
const showLanguageMenu = ref(false)

const allLanguageOptions = [
  { value: 'zh-CN', label: '简体中文', shortLabel: '中文', flag: '🇨🇳' },
  { value: 'en-US', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { value: 'ru-RU', label: 'Русский', shortLabel: 'RU', flag: '🇷🇺' },
  { value: 'ko-KR', label: '한국어', shortLabel: '한국어', flag: '🇰🇷' },
]

const languageOptions = computed(() =>
  allLanguageOptions.filter((lang) => isAllowedLocale(lang.value)),
)

const currentLanguage = computed(() => locale.value)
const currentLangOption = computed(() =>
  languageOptions.value.find((l) => l.value === currentLanguage.value)
  || allLanguageOptions.find((l) => l.value === currentLanguage.value),
)

const toggleLanguageMenu = () => {
  showLanguageMenu.value = !showLanguageMenu.value
}

const selectLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  editorResources.invalidate('promptTemplates')
  showLanguageMenu.value = false
  MessagePlugin.success(t('language.languageSaved'))
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.language-switch')) {
    showLanguageMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (featureFlags.restrictProviderOptions && !isAllowedLocale(locale.value)) {
    locale.value = 'zh-CN'
    localStorage.setItem('locale', 'zh-CN')
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="less" scoped>
.language-switch {
  position: relative;
  flex-shrink: 0;
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  font-family: var(--app-font-family);
  color: var(--td-text-color-primary);

  .lang-flag {
    font-size: 16px;
    flex-shrink: 0;
  }

  .lang-label {
    flex: 1;
  }

  .check-icon {
    color: var(--td-success-color);
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--td-bg-color-secondarycontainer);
  }

  &.active {
    background: var(--td-success-color-light);
    color: var(--td-brand-color-active);
  }
}

.language-switch--login {
  button {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 15px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: var(--td-text-color-anti);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--app-font-family);
    letter-spacing: 0.2px;
    cursor: pointer;

    .lang-flag-icon {
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }

    .link-text {
      line-height: 1;
    }

    svg:last-child {
      margin-left: 2px;
      flex-shrink: 0;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.4);
      color: var(--td-text-color-anti);
    }
  }

  .language-dropdown {
    background: rgba(255, 255, 255, 0.97);
  }
}

.language-switch--topbar {
  button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 8px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    font-family: var(--app-font-family);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    .lang-flag-icon {
      font-size: 15px;
      line-height: 1;
      flex-shrink: 0;
    }

    .link-text {
      line-height: 1;
    }

    svg:last-child {
      flex-shrink: 0;
    }

    &:hover {
      background: var(--td-bg-color-container-hover);
      color: var(--td-text-color-primary);
    }
  }
}
</style>

<style lang="less">
html[theme-mode="dark"] {
  .language-switch--login button {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .language-switch--login .language-dropdown,
  .language-switch--topbar .language-dropdown {
    background: rgba(36, 36, 36, 0.97);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
}
</style>
