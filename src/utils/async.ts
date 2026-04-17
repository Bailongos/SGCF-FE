export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  if (!items.length) return [];

  const safeLimit = Math.max(1, Math.floor(limit));
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  async function consumeQueue() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;

      try {
        const value = await worker(items[index] as T, index);
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(safeLimit, items.length) }, () => consumeQueue()));
  return results;
}
