import { describe, it, expect, vi } from 'vitest';
import { runWithConcurrency } from './async';

describe('runWithConcurrency', () => {
  it('returns empty array for empty items', async () => {
    const result = await runWithConcurrency([], 3, async () => 'x');
    expect(result).toEqual([]);
  });

  it('processes all items successfully', async () => {
    const worker = vi.fn().mockImplementation(async (item: number) => item * 2);
    const result = await runWithConcurrency([1, 2, 3], 2, worker);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ status: 'fulfilled', value: 2 });
    expect(result[1]).toEqual({ status: 'fulfilled', value: 4 });
    expect(result[2]).toEqual({ status: 'fulfilled', value: 6 });
    expect(worker).toHaveBeenCalledTimes(3);
  });

  it('preserves order of results', async () => {
    const worker = async (item: number) => {
      await new Promise((r) => setTimeout(r, 10 - item * 3));
      return item;
    };
    const result = await runWithConcurrency([1, 2, 3], 3, worker);

    expect(result[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(result[1]).toEqual({ status: 'fulfilled', value: 2 });
    expect(result[2]).toEqual({ status: 'fulfilled', value: 3 });
  });

  it('captures rejected promises', async () => {
    const worker = async (item: number) => {
      if (item === 2) throw new Error('fail');
      return item;
    };
    const result = await runWithConcurrency([1, 2, 3], 2, worker);

    expect(result[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(result[1]).toEqual({ status: 'rejected', reason: expect.any(Error) });
    expect((result[1] as PromiseRejectedResult).reason.message).toBe('fail');
    expect(result[2]).toEqual({ status: 'fulfilled', value: 3 });
  });

  it('clamps limit to minimum 1', async () => {
    const worker = vi.fn().mockResolvedValue('ok');
    await runWithConcurrency(['a'], 0, worker);
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('clamps limit to valid integer', async () => {
    const worker = vi.fn().mockResolvedValue('ok');
    await runWithConcurrency(['a'], 1.9, worker);
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('does not exceed concurrency limit', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const worker = async (_item: number) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent--;
      return _item;
    };

    await runWithConcurrency([1, 2, 3, 4, 5], 2, worker);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});
