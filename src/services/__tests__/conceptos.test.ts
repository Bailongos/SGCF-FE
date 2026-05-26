import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConceptos, createConcepto, updateConcepto, deleteConcepto } from '../conceptos';

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

describe('conceptos service', () => {
  it('getConceptos fetches from /conceptos', async () => {
    const mockData = [{ clave: 'INSCRIPCION', descripcion: 'Inscripción', monto_default: 100, genera_cuenta_default: true }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getConceptos();

    expect(api.get).toHaveBeenCalledWith('/conceptos');
    expect(result).toEqual(mockData);
  });

  it('createConcepto posts', async () => {
    const payload = { clave: 'COLEGIATURA', descripcion: 'Colegiatura', monto_default: 200, genera_cuenta_default: true };
    (api.post as any).mockResolvedValue({ data: { ...payload } });

    const result = await createConcepto(payload);

    expect(api.post).toHaveBeenCalledWith('/conceptos', payload);
    expect(result).toEqual(payload);
  });

  it('updateConcepto puts with encoded clave', async () => {
    const payload = { clave: 'INSCRIPCION', descripcion: 'Updated', monto_default: 150, genera_cuenta_default: false };
    (api.put as any).mockResolvedValue({ data: payload });

    await updateConcepto('INSCRIPCION', payload);

    expect(api.put).toHaveBeenCalledWith('/conceptos/INSCRIPCION', payload);
  });

  it('deleteConcepto deletes with encoded clave', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteConcepto('INSCRIPCION');

    expect(api.delete).toHaveBeenCalledWith('/conceptos/INSCRIPCION');
  });

  it('encodes special characters in clave for update and delete', async () => {
    (api.put as any).mockResolvedValue({ data: {} });
    (api.delete as any).mockResolvedValue({});

    await updateConcepto('CLAVE/1', { clave: 'CLAVE/1', descripcion: 'test', monto_default: 0, genera_cuenta_default: false });
    await deleteConcepto('CLAVE CON ESPACIOS');

    expect(api.put).toHaveBeenCalledWith('/conceptos/CLAVE%2F1', expect.anything());
    expect(api.delete).toHaveBeenCalledWith('/conceptos/CLAVE%20CON%20ESPACIOS');
  });

  describe('error handling', () => {
    it('throws on 404', async () => {
      const error = { response: { status: 404 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getConceptos()).rejects.toEqual(error);
    });

    it('throws on 500', async () => {
      const error = { response: { status: 500 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getConceptos()).rejects.toEqual(error);
    });

    it('throws on network error', async () => {
      const error = new Error('Network Error');
      (api.get as any).mockRejectedValue(error);
      await expect(getConceptos()).rejects.toThrow('Network Error');
    });
  });
});
