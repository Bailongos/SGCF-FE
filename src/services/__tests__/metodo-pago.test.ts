import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMetodosPago, createMetodoPago, updateMetodoPago, deleteMetodoPago } from '../metodo-pago';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import('../api');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('metodo-pago service', () => {
  it('getMetodosPago fetches from /metodos-pago', async () => {
    const mockData = [{ id_metodo: 1, nombre: 'Efectivo' }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getMetodosPago();

    expect(api.get).toHaveBeenCalledWith('/metodos-pago');
    expect(result).toEqual(mockData);
  });

  it('createMetodoPago posts', async () => {
    const payload = { nombre: 'Tarjeta' };
    (api.post as any).mockResolvedValue({ data: { id_metodo: 2, ...payload } });

    const result = await createMetodoPago(payload);

    expect(api.post).toHaveBeenCalledWith('/metodos-pago', payload);
    expect(result).toEqual({ id_metodo: 2, nombre: 'Tarjeta' });
  });

  it('updateMetodoPago puts', async () => {
    const payload = { nombre: 'Transferencia' };
    (api.put as any).mockResolvedValue({ data: { id_metodo: 1, ...payload } });

    await updateMetodoPago(1, payload);

    expect(api.put).toHaveBeenCalledWith('/metodos-pago/1', payload);
  });

  it('deleteMetodoPago deletes', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteMetodoPago(1);

    expect(api.delete).toHaveBeenCalledWith('/metodos-pago/1');
  });
});
