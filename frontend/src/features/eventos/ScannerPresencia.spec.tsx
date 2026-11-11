import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScannerPresencia } from './ScannerPresencia';
import { eventosApi } from '../../api';
import type { ResultadoPresencia } from '../../types/eventos';

vi.mock('../../api', () => ({
  eventosApi: { registrarPresencia: vi.fn() },
}));

// Sin cámara en jsdom: el escáner debe degradar al código manual.
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromVideoDevice() {
      throw new Error('sin camara');
    }
    stop() { /* noop */ }
  },
}));

const resultado: ResultadoPresencia = {
  actividad: {
    id: '11111111-2222-4333-8444-555555555555',
    titulo: 'Reunión de prueba',
    fecha: '2026-11-12T10:00:00.000Z',
    tipo: 'REUNION',
    estado: 'EN_CURSO',
  },
  estado: 'PRESENTE',
  yaRegistrado: false,
};

const registrarManual = (codigo: string) => {
  fireEvent.change(screen.getByLabelText(/código manual/i), {
    target: { value: codigo },
  });
  const form = screen.getByRole('button', { name: /^Registrar$/ }).closest('form');
  fireEvent.submit(form!);
};

describe('ScannerPresencia', () => {
  beforeEach(() => {
    vi.mocked(eventosApi.registrarPresencia).mockResolvedValue(resultado);
  });

  it('registra la presencia con el código manual', async () => {
    render(<ScannerPresencia open onClose={() => undefined} />);

    registrarManual('  presencia:v1:abc  ');

    expect(await screen.findByTestId('resultado-presencia')).toBeInTheDocument();
    expect(screen.getByText('¡Presencia registrada!')).toBeInTheDocument();
    expect(screen.getByText(/Reunión de prueba · PRESENTE/)).toBeInTheDocument();
    expect(eventosApi.registrarPresencia).toHaveBeenCalledWith('presencia:v1:abc');
  });

  it('muestra "ya registrado" cuando el backend lo indica', async () => {
    vi.mocked(eventosApi.registrarPresencia).mockResolvedValue({
      ...resultado,
      yaRegistrado: true,
    });

    render(<ScannerPresencia open onClose={() => undefined} />);
    registrarManual('presencia:v1:abc');

    expect(await screen.findByText('Ya estabas marcado presente')).toBeInTheDocument();
  });

  it('muestra el error del backend ante un código inválido', async () => {
    vi.mocked(eventosApi.registrarPresencia).mockRejectedValue(
      new Error('Código QR inválido o expirado'),
    );

    render(<ScannerPresencia open onClose={() => undefined} />);
    registrarManual('presencia:v1:alterado');

    expect(await screen.findByText('Código QR inválido o expirado')).toBeInTheDocument();
    expect(screen.queryByTestId('resultado-presencia')).not.toBeInTheDocument();
    // vuelve al modo listo para reintentar
    await waitFor(() => expect(screen.getByLabelText(/código manual/i)).toBeInTheDocument());
  });

  it('avisa si no hay cámara y ofrece el código manual', async () => {
    render(<ScannerPresencia open onClose={() => undefined} />);

    expect(await screen.findByText(/No se pudo acceder a la cámara/)).toBeInTheDocument();
    expect(screen.getByLabelText(/código manual/i)).toBeInTheDocument();
  });

  it('no registra con el código vacío', () => {
    render(<ScannerPresencia open onClose={() => undefined} />);

    const form = screen.getByRole('button', { name: /^Registrar$/ }).closest('form');
    fireEvent.submit(form!);

    expect(eventosApi.registrarPresencia).not.toHaveBeenCalled();
  });
});
