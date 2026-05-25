import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCiclosEscolares, createCicloEscolar, updateCicloEscolar, deleteCicloEscolar } from '../ciclos-escolares';

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

describe('ciclos-escolares service', () => {
  it('getCiclosEscolares fetches from /ciclos-escolares', async () => {
    const mockData = [{ id_ciclo: 1, nombre: '2024-A', fecha_inicio: '2024-01-01', fecha_fin: '2024-06-30', es_actual: true }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getCiclosEscolares();

    expect(api.get).toHaveBeenCalledWith('/ciclos-escolares');
    expect(result).toEqual(mockData);
  });

  it('createCicloEscolar posts', async () => {
    const payload = { nombre: '2025-A', fecha_inicio: '2025-01-01', fecha_fin: '2025-06-30', es_actual: false };
    const mockResponse = { id_ciclo: 2, ...payload };
    (api.post as any).mockResolvedValue({ data: mockResponse });

    const result = await createCicloEscolar(payload);

    expect(api.post).toHaveBeenCalledWith('/ciclos-escolares', payload);
    expect(result).toEqual(mockResponse);
  });

  it('updateCicloEscolar puts', async () => {
    const payload = { nombre: '2025-B', fecha_inicio: '2025-07-01', fecha_fin: '2025-12-31', es_actual: true };
    (api.put as any).mockResolvedValue({ data: { id_ciclo: 2, ...payload } });

    await updateCicloEscolar(2, payload);

    expect(api.put).toHaveBeenCalledWith('/ciclos-escolares/2', payload);
  });

  it('deleteCicloEscolar deletes', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteCicloEscolar(2);

    expect(api.delete).toHaveBeenCalledWith('/ciclos-escolares/2');
  });
});
