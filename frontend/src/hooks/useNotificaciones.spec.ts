import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNotificaciones } from './useNotificaciones';
import { notificacionesApi } from '../api';
import type { ListadoNotificaciones, Notificacion } from '../types/notificacion';

vi.mock('../api', () => ({
  notificacionesApi: {
    listar: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodas: vi.fn(),
  },
}));

const listar = vi.mocked(notificacionesApi.listar);
const marcarLeidaApi = vi.mocked(notificacionesApi.marcarLeida);
const marcarTodasApi = vi.mocked(notificacionesApi.marcarTodas);

const notif = (id: string, leida: boolean): Notificacion => ({
  id,
  usuarioId: 'u1',
  tipo: 'CUENTA_CREADA',
  titulo: 'Cuenta creada',
  cuerpo: 'Tu cuenta ya está activa.',
  link: '/app',
  leidaEn: leida ? '2026-11-09T10:00:00.000Z' : null,
  createdAt: '2026-11-09T09:00:00.000Z',
});

const listado = (noLeidas: number): ListadoNotificaciones => ({
  items: [notif('n1', noLeidas === 0)],
  total: 1,
  noLeidas,
});

describe('useNotificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga la lista al montar y expone el badge de no leídas', async () => {
    listar.mockResolvedValue(listado(2));

    const { result } = renderHook(() => useNotificaciones());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.noLeidas).toBe(2);
    expect(result.current.error).toBeNull();
    expect(listar).toHaveBeenCalledTimes(1);
    expect(listar).toHaveBeenCalledWith({ limit: 20 });
  });

  it('expone el error solo en la carga inicial', async () => {
    listar.mockRejectedValue(new Error('Sin conexión'));

    const { result } = renderHook(() => useNotificaciones());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Sin conexión');
    expect(result.current.items).toHaveLength(0);
    expect(result.current.noLeidas).toBe(0);
  });

  it('sondea cada 60 s, traga los errores del sondeo y se detiene al desmontar', async () => {
    vi.useFakeTimers();
    listar
      .mockResolvedValueOnce(listado(1))
      .mockRejectedValueOnce(new Error('red caída'))
      .mockResolvedValueOnce(listado(2));

    const { result, unmount } = renderHook(() => useNotificaciones());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.noLeidas).toBe(1);

    // 1er sondeo: falla en silencio (sin error visible, badge conservado).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(listar).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.noLeidas).toBe(1);

    // 2º sondeo: recoge el dato nuevo.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(result.current.noLeidas).toBe(2);

    // Desmontar limpia el intervalo: no vuelve a preguntar.
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(listar).toHaveBeenCalledTimes(3);
  });

  it('marcarLeida es optimista: baja el badge sin esperar al servidor', async () => {
    listar.mockResolvedValue(listado(1));
    marcarLeidaApi.mockReturnValue(new Promise(() => {})); // queda pendiente

    const { result } = renderHook(() => useNotificaciones());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.marcarLeida('n1');
    });

    expect(result.current.noLeidas).toBe(0);
    expect(result.current.items[0].leidaEn).not.toBeNull();
    expect(marcarLeidaApi).toHaveBeenCalledWith('n1');
    expect(listar).toHaveBeenCalledTimes(1); // sin recarga extra
  });

  it('si marcarLeida falla, reconcilia con el servidor', async () => {
    listar.mockResolvedValueOnce(listado(1)).mockResolvedValueOnce(listado(1));
    marcarLeidaApi.mockRejectedValue(new Error('Notificación no encontrada'));

    const { result } = renderHook(() => useNotificaciones());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.marcarLeida('n1');
    });

    // Recarga silenciosa: el badge vuelve al estado real (1 no leída).
    expect(listar).toHaveBeenCalledTimes(2);
    expect(result.current.noLeidas).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('marcarTodas pone el badge en cero al instante', async () => {
    listar.mockResolvedValue(listado(2));
    marcarTodasApi.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useNotificaciones());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.marcarTodas();
    });

    expect(result.current.noLeidas).toBe(0);
    expect(result.current.items[0].leidaEn).not.toBeNull();
    expect(marcarTodasApi).toHaveBeenCalledTimes(1);
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('si marcarTodas falla, restaura la lista y reconcilia con el servidor', async () => {
    listar.mockResolvedValueOnce(listado(2)).mockResolvedValueOnce(listado(2));
    marcarTodasApi.mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useNotificaciones());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.marcarTodas();
    });

    expect(listar).toHaveBeenCalledTimes(2);
    expect(result.current.noLeidas).toBe(2);
  });
});
