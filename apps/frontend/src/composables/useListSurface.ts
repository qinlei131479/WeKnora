import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useListSurface<T extends string>(getAllowed: () => T[], fallback: T) {
  const route = useRoute()
  const router = useRouter()

  const surface = computed({
    get(): T {
      const allowed = getAllowed()
      const raw = String(route.query.surface || '')
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
