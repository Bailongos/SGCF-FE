import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoles, createRol, updateRol, deleteRol, getRolesPermisos, updateRolesPermisos } from '../roles';

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

  it('getRolesPermisos fetches from /admin/roles-permisos', async () => {
    const mockData = { roles: [], permisos: [], rol_permisos: [] };
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getRolesPermisos();

    expect(api.get).toHaveBeenCalledWith('/admin/roles-permisos');
    expect(result).toEqual(mockData);
  });

  it('updateRolesPermisos posts to /admin/roles-permisos', async () => {
    const mockResponse = { data: { success: true } };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await updateRolesPermisos(1, [1, 2, 3]);

    expect(api.post).toHaveBeenCalledWith('/admin/roles-permisos', { id_rol: 1, id_permisos: [1, 2, 3] });
    expect(result).toEqual({ success: true });
  });

  describe('error handling', () => {
    it('throws on server error', async () => {
      const error = { response: { status: 500 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getRoles()).rejects.toEqual(error);
    });

    it('throws on network error', async () => {
      const error = new Error('Network Error');
      (api.get as any).mockRejectedValue(error);
      await expect(getRoles()).rejects.toThrow('Network Error');
    });
  });
});
