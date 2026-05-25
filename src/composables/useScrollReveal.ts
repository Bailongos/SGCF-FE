import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useScrollReveal(
  targetRef: Ref<HTMLElement | null>,
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options
  const isVisible = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = targetRef.value
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) {
          isVisible.value = true
          if (once) observer?.unobserve(el)
        } else if (!once) {
          isVisible.value = false
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { isVisible }
}
