import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCarreras, createCarrera, updateCarrera, deleteCarrera } from '../carreras';

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

describe('carreras service', () => {
  it('getCarreras fetches and normalizes', async () => {
    const rawData = [
      { id_carrera: '1', clave: 'ISC', nombre: ' Sistemas ', duracion_semestres: '8' },
    ];
    (api.get as any).mockResolvedValue({ data: rawData });

    const result = await getCarreras();

    expect(api.get).toHaveBeenCalledWith('/carreras');
    expect(result).toEqual([
      { id_carrera: 1, clave: 'ISC', nombre: 'Sistemas', duracion_semestres: 8 },
    ]);
  });

  it('createCarrera posts and normalizes response', async () => {
    const payload = { clave: 'ISC', nombre: 'Sistemas', duracion_semestres: 8 };
    const rawResponse = { id_carrera: '2', clave: 'ISC', nombre: ' Sistemas ', duracion_semestres: '8' };
    (api.post as any).mockResolvedValue({ data: rawResponse });

    const result = await createCarrera(payload);

    expect(api.post).toHaveBeenCalledWith('/carreras', payload);
    expect(result).toEqual({ id_carrera: 2, clave: 'ISC', nombre: 'Sistemas', duracion_semestres: 8 });
  });

  it('updateCarrera puts and normalizes', async () => {
    const payload = { nombre: 'Nuevo nombre' };
    const rawResponse = { id_carrera: 5, clave: 'ISC', nombre: 'Nuevo nombre', duracion_semestres: null };
    (api.put as any).mockResolvedValue({ data: rawResponse });

    const result = await updateCarrera(5, payload);

    expect(api.put).toHaveBeenCalledWith('/carreras/5', payload);
    expect(result.duracion_semestres).toBe(0);
  });

  it('deleteCarrera deletes from /carreras/:id', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteCarrera(5);

    expect(api.delete).toHaveBeenCalledWith('/carreras/5');
  });
});
