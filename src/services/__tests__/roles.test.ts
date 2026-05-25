import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoles, createRol, updateRol, deleteRol } from '../roles';

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

describe('roles service', () => {
  it('getRoles fetches from /roles', async () => {
    const mockData = [{ id_rol: 1, nombre_rol: 'Administrador' }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getRoles();

    expect(api.get).toHaveBeenCalledWith('/roles');
    expect(result).toEqual(mockData);
  });

  it('createRol posts', async () => {
    const payload = { nombre_rol: 'New Role' };
    (api.post as any).mockResolvedValue({ data: { id_rol: 5, ...payload } });

    const result = await createRol(payload);

    expect(api.post).toHaveBeenCalledWith('/roles', payload);
    expect(result).toEqual({ id_rol: 5, nombre_rol: 'New Role' });
  });

  it('updateRol puts', async () => {
    const payload = { nombre_rol: 'Updated' };
    (api.put as any).mockResolvedValue({ data: { id_rol: 1, ...payload } });

    await updateRol(1, payload);

    expect(api.put).toHaveBeenCalledWith('/roles/1', payload);
  });

  it('deleteRol deletes', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteRol(1);

    expect(api.delete).toHaveBeenCalledWith('/roles/1');
  });
});
