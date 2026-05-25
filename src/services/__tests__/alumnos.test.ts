import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../alumnos';

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

describe('alumnos service', () => {
  it('getAlumnos fetches from /alumnos', async () => {
    const mockData = [{ matricula: 'A001', nombre_completo: 'Test' }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getAlumnos();

    expect(api.get).toHaveBeenCalledWith('/alumnos');
    expect(result).toEqual(mockData);
  });

  it('createAlumno posts to /alumnos', async () => {
    const payload = { matricula: 'A001', nombre_completo: 'Test', id_carrera: 1 };
    const mockResponse = { ...payload, activo: true, semestre_actual: 1, email_institucional: null, telefono_contacto: null, fecha_registro: '2024-01-01' };
    (api.post as any).mockResolvedValue({ data: mockResponse });

    const result = await createAlumno(payload);

    expect(api.post).toHaveBeenCalledWith('/alumnos', payload);
    expect(result).toEqual(mockResponse);
  });

  it('updateAlumno puts to /alumnos/:matricula', async () => {
    const payload = { nombre_completo: 'Updated' };
    const mockResponse = { matricula: 'A001', nombre_completo: 'Updated' };
    (api.put as any).mockResolvedValue({ data: mockResponse });

    const result = await updateAlumno('A001', payload);

    expect(api.put).toHaveBeenCalledWith('/alumnos/A001', payload);
    expect(result).toEqual(mockResponse);
  });

  it('deleteAlumno deletes from /alumnos/:matricula', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteAlumno('A001');

    expect(api.delete).toHaveBeenCalledWith('/alumnos/A001');
  });
});
