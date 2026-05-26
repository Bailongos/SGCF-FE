import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../usuarios';

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

describe('usuarios service', () => {
  it('getUsuarios fetches from /usuarios', async () => {
    const mockData = [{ id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getUsuarios();

    expect(api.get).toHaveBeenCalledWith('/usuarios');
    expect(result).toEqual(mockData);
  });

  it('createUsuario posts', async () => {
    const payload = { username: 'newuser', password: 'pass', id_rol: 6 };
    (api.post as any).mockResolvedValue({ data: { id_usuario: 3, ...payload, activo: false, id_carrera: null } });

    const result = await createUsuario(payload);

    expect(api.post).toHaveBeenCalledWith('/usuarios', payload);
    expect(result.id_usuario).toBe(3);
  });

  it('updateUsuario puts', async () => {
    const payload = { username: 'updated', password: 'newpass', id_rol: 2 };
    (api.put as any).mockResolvedValue({ data: { id_usuario: 1, ...payload, activo: true, id_carrera: null } });

    await updateUsuario(1, payload);

    expect(api.put).toHaveBeenCalledWith('/usuarios/1', payload);
  });

  it('deleteUsuario deletes', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteUsuario(1);

    expect(api.delete).toHaveBeenCalledWith('/usuarios/1');
  });

  describe('error handling', () => {
    it('throws on 404', async () => {
      const error = { response: { status: 404 }, isAxiosError: true };
      (api.get as any).mockRejectedValue(error);
      await expect(getUsuarios()).rejects.toEqual(error);
    });

    it('throws on 500', async () => {
      const error = { response: { status: 500 }, isAxiosError: true };
      (api.post as any).mockRejectedValue(error);
      await expect(createUsuario({ username: 'x', password: 'p', id_rol: 2 })).rejects.toEqual(error);
    });

    it('throws on network error', async () => {
      const error = new Error('Network Error');
      (api.get as any).mockRejectedValue(error);
      await expect(getUsuarios()).rejects.toThrow('Network Error');
    });
  });
});
