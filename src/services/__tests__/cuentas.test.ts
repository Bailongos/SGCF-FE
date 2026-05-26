import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCuentas, createCuenta, updateCuenta, deleteCuenta } from '../cuentas';

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

describe('cuentas service', () => {
  it('getCuentas fetches from /cuentas', async () => {
    const mockData = [{ id_cuenta: 1, matricula: 'A001', concepto: 'INSCRIPCION', monto: 100 }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getCuentas();

    expect(api.get).toHaveBeenCalledWith('/cuentas');
    expect(result).toEqual(mockData);
  });

  it('createCuenta posts to /cuentas', async () => {
    const payload = { matricula: 'A001', concepto: 'INSCRIPCION', id_ciclo: 1, monto: 100, pagado: false };
    const mockResponse = { ...payload, id_cuenta: 1, fecha_creacion: '2024-01-01', fecha_pago: null, id_metodo: null };
    (api.post as any).mockResolvedValue({ data: mockResponse });

    const result = await createCuenta(payload);

    expect(api.post).toHaveBeenCalledWith('/cuentas', payload);
    expect(result).toEqual(mockResponse);
  });

  it('updateCuenta puts to /cuentas/:id', async () => {
    const payload = { matricula: 'A001', concepto: 'INSCRIPCION', id_ciclo: 1, monto: 150, pagado: true };
    const mockResponse = { ...payload, id_cuenta: 1 };
    (api.put as any).mockResolvedValue({ data: mockResponse });

    const result = await updateCuenta(1, payload);

    expect(api.put).toHaveBeenCalledWith('/cuentas/1', payload);
    expect(result).toEqual(mockResponse);
  });

  it('deleteCuenta deletes from /cuentas/:id', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteCuenta(1);

    expect(api.delete).toHaveBeenCalledWith('/cuentas/1');
  });

  describe('error handling', () => {
    it('throws on 404', async () => {
      const error = { response: { status: 404 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getCuentas()).rejects.toEqual(error);
    });

    it('throws on 500', async () => {
      const error = { response: { status: 500 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getCuentas()).rejects.toEqual(error);
    });

    it('throws on network error', async () => {
      const error = new Error('Network Error');
      (api.get as any).mockRejectedValue(error);
      await expect(getCuentas()).rejects.toThrow('Network Error');
    });
  });
});
