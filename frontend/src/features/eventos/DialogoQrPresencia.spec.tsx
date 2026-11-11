import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QRCode from 'qrcode';
import { DialogoQrPresencia } from './DialogoQrPresencia';
import { eventosApi } from '../../api';
import type { QrPresencia } from '../../types/eventos';

vi.mock('../../api', () => ({
  eventosApi: { qrPresencia: vi.fn() },
}));

// restoreMocks borra las implementaciones del factory: se reponen en beforeEach.
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn() },
}));

const qr: QrPresencia = {
  actividadId: '11111111-2222-4333-8444-555555555555',
  titulo: 'Reunión de prueba',
  codigo: 'presencia:v1:11111111-2222-4333-8444-555555555555:999:abc',
  expira: '2026-11-12T10:00:00.000Z',
};

describe('DialogoQrPresencia', () => {
  beforeEach(() => {
    vi.mocked(eventosApi.qrPresencia).mockResolvedValue(qr);
    // Firma real de `qrcode` con sobrecargas: se tipa como vi.fn para el mock.
    (QRCode.toDataURL as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'data:image/png;base64,QR',
    );
  });

  it('genera el QR y pinta la imagen con el título de la actividad', async () => {
    render(<DialogoQrPresencia open actividadId={qr.actividadId} onClose={() => undefined} />);

    expect(await screen.findByTestId('qr-presencia-img')).toBeInTheDocument();
    expect(screen.getByText('Reunión de prueba')).toBeInTheDocument();
    expect(eventosApi.qrPresencia).toHaveBeenCalledWith(qr.actividadId);
    expect(screen.getByAltText('QR de presencia de Reunión de prueba')).toBeInTheDocument();
  });

  it('muestra la caducidad del código', async () => {
    render(<DialogoQrPresencia open actividadId={qr.actividadId} onClose={() => undefined} />);

    await screen.findByTestId('qr-presencia-img');
    expect(screen.getByText(/Válido hasta/)).toBeInTheDocument();
  });

  it('muestra el error del API si la generación falla', async () => {
    vi.mocked(eventosApi.qrPresencia).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'No tienes permiso para esta actividad' } },
    });

    render(<DialogoQrPresencia open actividadId={qr.actividadId} onClose={() => undefined} />);

    expect(await screen.findByText('No tienes permiso para esta actividad')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-presencia-img')).not.toBeInTheDocument();
  });

  it('al pulsar Regenerar vuelve a pedir un QR nuevo', async () => {
    render(<DialogoQrPresencia open actividadId={qr.actividadId} onClose={() => undefined} />);
    await screen.findByTestId('qr-presencia-img');

    screen.getByRole('button', { name: /Regenerar/ }).click();

    await waitFor(() => expect(eventosApi.qrPresencia).toHaveBeenCalledTimes(2));
  });

  it('no pide nada con el diálogo cerrado', () => {
    render(<DialogoQrPresencia open={false} actividadId={qr.actividadId} onClose={() => undefined} />);

    expect(eventosApi.qrPresencia).not.toHaveBeenCalled();
  });
});
