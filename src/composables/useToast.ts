import { reactive, readonly } from 'vue';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

const state = reactive<{
  toasts: ToastItem[];
}>({
  toasts: [],
});

let nextId = 1;

function add(t: Omit<ToastItem, 'id'>) {
  const id = nextId++;
  state.toasts.push({ id, ...t });
  const dur = t.duration ?? (t.type === 'error' ? 5000 : 3000);
  if (dur > 0) {
    setTimeout(() => remove(id), dur);
  }
  return id;
}

function remove(id: number) {
  const idx = state.toasts.findIndex((t) => t.id === id);
  if (idx !== -1) state.toasts.splice(idx, 1);
}

export function useToast() {
  function success(message: string, title?: string, duration?: number) {
    return add({ type: 'success', message, title, duration });
  }

  function error(message: string, title?: string, duration?: number) {
    return add({ type: 'error', message, title, duration });
  }

  function info(message: string, title?: string, duration?: number) {
    return add({ type: 'info', message, title, duration });
  }

  return {
    toasts: readonly(state).toasts as readonly ToastItem[],
    success,
    error,
    info,
    remove,
  };
}
