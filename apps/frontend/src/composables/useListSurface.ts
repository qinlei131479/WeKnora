import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useListSurface<T extends string>(getAllowed: () => T[], fallback: T) {
  const route = useRoute()
  const router = useRouter()

  const surface = computed({
    get(): T {
      const allowed = getAllowed()
      let raw = String(route.query.surface || '')
      // 旧链接 ?surface=runtime 与工作模式 surface=work 对齐
      if (raw === 'runtime' && (allowed as string[]).includes('work')) {
        raw = 'work'
      }
      return allowed.includes(raw as T) ? (raw as T) : fallback
    },
    set(next: T) {
      const query = { ...route.query }
      if (next === fallback) {
        delete query.surface
      } else {
        query.surface = next
      }
      void router.replace({ query })
    },
  })

  return { surface }
}
