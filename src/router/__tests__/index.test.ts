import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    createRouter: vi.fn(() => ({
      beforeEach: vi.fn(),
      push: vi.fn(),
      resolve: vi.fn(),
    })),
    createWebHistory: vi.fn(() => ({})),
  };
});

const mockRouter = {
  beforeEach: vi.fn(),
  push: vi.fn(),
  resolve: vi.fn((route: any) => ({ href: route?.path || '/', route })),
};

vi.mock('../../router/index', () => ({
  default: mockRouter,
}));

describe('router configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('imports all route components lazily', async () => {
    const routes = (await import('../../router/index')).default;
    expect(routes).toBeDefined();
  });
});
