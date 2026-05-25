import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getObservaciones, createObservacion, updateObservacion, deleteObservacion, getTiposObservacion } from '../observaciones';

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

describe('observaciones service', () => {
  it('getTiposObservacion fetches and normalizes', async () => {
    const rawData = [
      { clave: ' academica ', nombre: 'Observación Académica' },
      { clave: null, nombre: null },
    ];
    (api.get as any).mockResolvedValue({ data: rawData });

    const result = await getTiposObservacion();

    expect(api.get).toHaveBeenCalledWith('/tipos-observacion');
    expect(result[0]).toEqual({ clave: 'ACADEMICA', nombre: 'Observación Académica' });
    expect(result[1]).toEqual({ clave: '', nombre: '' });
  });

  it('getObservaciones fetches and normalizes', async () => {
    const rawData = [
      { id_observacion: '1', matricula: ' A001 ', detalle: 'Test', tipo_clave: ' ACADEMICA ', id_autor: '5', fecha: '2024-01-01' },
    ];
    (api.get as any).mockResolvedValue({ data: rawData });

    const result = await getObservaciones({ matricula: 'A001' });

    expect(api.get).toHaveBeenCalledWith('/observaciones', {
      params: { matricula: 'A001', tipo: undefined },
    });
    expect(result[0]).toEqual({
      id_observacion: 1,
      matricula: 'A001',
      detalle: 'Test',
      tipo_clave: 'ACADEMICA',
      tipo_nombre: null,
      id_autor: 5,
      fecha: '2024-01-01',
    });
  });

  it('createObservacion posts and normalizes', async () => {
    const payload = { matricula: 'A001', detalle: 'Nueva obs', tipo_clave: 'CONDUCTA', id_autor: 1 };
    const rawResponse = { id_observacion: '2', matricula: 'A001', detalle: 'Nueva obs', tipo_clave: ' conducta ', id_autor: '1', fecha: '2024-06-01' };
    (api.post as any).mockResolvedValue({ data: rawResponse });

    const result = await createObservacion(payload);

    expect(api.post).toHaveBeenCalledWith('/observaciones', payload);
    expect(result).toEqual({
      id_observacion: 2,
      matricula: 'A001',
      detalle: 'Nueva obs',
      tipo_clave: 'CONDUCTA',
      tipo_nombre: null,
      id_autor: 1,
      fecha: '2024-06-01',
    });
  });

  it('updateObservacion puts and normalizes', async () => {
    const payload = { matricula: 'A001', detalle: 'Updated', tipo_clave: 'ACADEMICA', id_autor: 1 };
    const rawResponse = { id_observacion: 1, matricula: 'A001', detalle: 'Updated', tipo_clave: 'ACADEMICA', id_autor: null, fecha: '2024-01-01' };
    (api.put as any).mockResolvedValue({ data: rawResponse });

    const result = await updateObservacion(1, payload);

    expect(api.put).toHaveBeenCalledWith('/observaciones/1', payload);
    expect(result.id_autor).toBeNull();
  });

  it('deleteObservacion deletes', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteObservacion(1);

    expect(api.delete).toHaveBeenCalledWith('/observaciones/1');
  });
});
