import { onUnmounted, watch } from 'vue';

const INACTIVITY_MS = 30 * 60 * 1000;

export function useSessionTimeout(active: boolean, onExpire: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let started = false;

  const events = ['mousemove', 'mousedown', 'click', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

  function reset() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      onExpire();
    }, INACTIVITY_MS);
  }

  function handler() {
    reset();
  }

  function start() {
    if (started) return;
    started = true;
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    reset();
  }

  function stop() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!started) return;
    started = false;
    events.forEach((e) => document.removeEventListener(e, handler));
  }

  watch(() => active, (val) => {
    if (val) start();
    else stop();
  }, { immediate: true });

  onUnmounted(() => stop());
}
