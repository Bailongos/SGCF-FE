import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminUsuarios, createAdminUsuario, patchAdminUsuario, getAdminRoles, getAdminCarreras } from '../admin-usuarios';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock('../api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function networkError() {
  return Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
}

function serverError() {
  return Object.assign(new Error('Server Error'), { response: { status: 500 } });
}

function notFoundError() {
  return Object.assign(new Error('Not Found'), { response: { status: 404 } });
}

function methodNotAllowed() {
  return Object.assign(new Error('Method Not Allowed'), { response: { status: 405 } });
}

describe('admin-usuarios service', () => {
  describe('getAdminUsuarios', () => {
    it('fetches from /admin/usuarios on success', async () => {
      const mockData = [{ id_usuario: 1, username: 'admin' }];
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await getAdminUsuarios();

      expect(mockGet).toHaveBeenCalledWith('/admin/usuarios');
      expect(result).toEqual(mockData);
    });

    it('falls back to /usuarios on ERR_NETWORK', async () => {
      mockGet.mockRejectedValueOnce(networkError());
      const fallbackData = [{ id_usuario: 2, username: 'fallback' }];
      mockGet.mockResolvedValueOnce({ data: fallbackData });

      const result = await getAdminUsuarios();

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith('/usuarios');
      expect(result).toEqual(fallbackData);
    });

    it('falls back on 500 error', async () => {
      mockGet.mockRejectedValueOnce(serverError());
      mockGet.mockResolvedValueOnce({ data: [] });

      await getAdminUsuarios();

      expect(mockGet).toHaveBeenLastCalledWith('/usuarios');
    });

    it('throws if fallback also fails', async () => {
      mockGet.mockRejectedValueOnce(networkError());
      mockGet.mockRejectedValueOnce(networkError());

      await expect(getAdminUsuarios()).rejects.toThrow();
    });

    it('throws on non-fallback errors', async () => {
      const error = Object.assign(new Error('Bad Request'), { response: { status: 400 } });
      mockGet.mockRejectedValueOnce(error);

      await expect(getAdminUsuarios()).rejects.toThrow('Bad Request');
    });
  });

  describe('createAdminUsuario', () => {
    it('posts to /admin/usuarios on success', async () => {
      const payload = { username: 'test', password: 'pass', id_rol: 6 };
      mockPost.mockResolvedValueOnce({ data: { id_usuario: 1, ...payload } });

      const result = await createAdminUsuario(payload);

      expect(mockPost).toHaveBeenCalledWith('/admin/usuarios', payload);
      expect(result.id_usuario).toBe(1);
    });

    it('falls back to /usuarios on 405', async () => {
      const payload = { username: 'test', password: 'pass', id_rol: 6 };
      mockPost.mockRejectedValueOnce(methodNotAllowed());
      mockPost.mockResolvedValueOnce({ data: { id_usuario: 2, ...payload } });

      const result = await createAdminUsuario(payload);

      expect(mockPost).toHaveBeenLastCalledWith('/usuarios', payload);
      expect(result.id_usuario).toBe(2);
    });
  });

  describe('patchAdminUsuario', () => {
    it('puts to /admin/usuarios/:id on success', async () => {
      const payload = { username: 'updated', id_rol: 1 };
      mockPut.mockResolvedValueOnce({ data: { id_usuario: 5, ...payload } });

      const result = await patchAdminUsuario(5, payload);

      expect(mockPut).toHaveBeenCalledWith('/admin/usuarios/5', payload);
      expect(result.id_usuario).toBe(5);
    });

    it('falls back with full payload when username and id_rol are provided', async () => {
      const payload = { username: 'user', id_rol: 2, activo: true };
      mockPut.mockRejectedValueOnce(networkError());
      mockPut.mockResolvedValueOnce({ data: { id_usuario: 3, ...payload } });

      await patchAdminUsuario(3, payload);

      expect(mockPut).toHaveBeenLastCalledWith('/usuarios/3', payload);
    });

    it('falls back with merged payload when partial', async () => {
      const payload = { activo: false };
      mockPut.mockRejectedValueOnce(networkError());
      mockGet.mockResolvedValueOnce({ data: [{ id_usuario: 4, username: 'existing', id_rol: 6, id_carrera: null, activo: true }] });
      mockPut.mockResolvedValueOnce({ data: { id_usuario: 4, username: 'existing', id_rol: 6, id_carrera: null, activo: false } });

      const result = await patchAdminUsuario(4, payload);

      expect(mockPut).toHaveBeenLastCalledWith('/usuarios/4', {
        username: 'existing',
        id_rol: 6,
        id_carrera: null,
        activo: false,
        email: null,
        password: undefined,
      });
      expect(result.activo).toBe(false);
    });
  });

  describe('getAdminRoles', () => {
    it('fetches from /admin/roles on success', async () => {
      mockGet.mockResolvedValueOnce({ data: [{ id_rol: 1, nombre_rol: 'Admin' }] });

      const result = await getAdminRoles();

      expect(mockGet).toHaveBeenCalledWith('/admin/roles');
      expect(result).toEqual([{ id_rol: 1, nombre_rol: 'Admin' }]);
    });

    it('falls back to /roles on 404', async () => {
      mockGet.mockRejectedValueOnce(notFoundError());
      mockGet.mockResolvedValueOnce({ data: [{ id_rol: 6, nombre_rol: 'Sin Rol' }] });

      const result = await getAdminRoles();

      expect(mockGet).toHaveBeenLastCalledWith('/roles');
      expect(result).toEqual([{ id_rol: 6, nombre_rol: 'Sin Rol' }]);
    });
  });

  describe('getAdminCarreras', () => {
    it('fetches and normalizes from /admin/carreras', async () => {
      const rawData = [{ id_carrera: '1', clave: 'ISC', nombre: 'Sistemas' }];
      mockGet.mockResolvedValueOnce({ data: rawData });

      const result = await getAdminCarreras();

      expect(mockGet).toHaveBeenCalledWith('/admin/carreras');
      expect(result).toEqual([{ id_carrera: 1, clave: 'ISC', nombre: 'Sistemas' }]);
    });

    it('normalizes empty values', async () => {
      const rawData = [{ id_carrera: '2', clave: null, nombre: null }];
      mockGet.mockResolvedValueOnce({ data: rawData });

      const result = await getAdminCarreras();

      expect(result).toEqual([{ id_carrera: 2, clave: '', nombre: '' }]);
    });

    it('falls back to /carreras on ERR_NETWORK', async () => {
      mockGet.mockRejectedValueOnce(networkError());
      mockGet.mockResolvedValueOnce({ data: [{ id_carrera: '3', clave: 'LEC', nombre: 'Letras' }] });

      const result = await getAdminCarreras();

      expect(mockGet).toHaveBeenLastCalledWith('/carreras');
      expect(result).toEqual([{ id_carrera: 3, clave: 'LEC', nombre: 'Letras' }]);
    });
  });
});
