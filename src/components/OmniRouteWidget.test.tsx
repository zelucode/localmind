import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  probePorts: vi.fn(),
}));

import { probePorts } from '../lib/backend';
import { BackendUnavailableError } from '../lib/tauri';
import { OmniRouteWidget } from './OmniRouteWidget';

const probe = vi.mocked(probePorts);

describe('OmniRouteWidget', () => {
  it('scans the four known ports on mount', async () => {
    probe.mockResolvedValue([]);
    render(<OmniRouteWidget />);
    await waitFor(() => expect(probe).toHaveBeenCalledWith([8000, 11434, 1234, 1337]));
  });

  it('shows only services the backend reports as online', async () => {
    probe.mockResolvedValue([
      { port: 8000, online: true, latencyMs: 3 },
      { port: 11434, online: false, latencyMs: null },
      { port: 1234, online: false, latencyMs: null },
      { port: 1337, online: false, latencyMs: null },
    ]);
    const onStatusChange = vi.fn();
    render(<OmniRouteWidget onStatusChange={onStatusChange} />);

    expect(await screen.findByText('OmniRoute Active')).toBeInTheDocument();
    expect(screen.getByText('Online (3ms)')).toBeInTheDocument();
    expect(screen.getAllByText('Offline')).toHaveLength(3);
    expect(onStatusChange).toHaveBeenLastCalledWith(true);
  });

  it('never claims a service is online when the scan could not run', async () => {
    probe.mockRejectedValue(new BackendUnavailableError('Scanning local ports'));
    const onStatusChange = vi.fn();
    render(<OmniRouteWidget onStatusChange={onStatusChange} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Scanning local ports needs the LocalMind desktop app.');
    expect(screen.getByText('OmniRoute Standby')).toBeInTheDocument();
    expect(screen.queryByText(/^Online/)).not.toBeInTheDocument();
    expect(onStatusChange).toHaveBeenLastCalledWith(false);
  });

  it('rescans when "Scan Local Ports" is clicked', async () => {
    probe.mockResolvedValue([]);
    render(<OmniRouteWidget />);
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: /Scan Local Ports/ }));
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(2));
  });

  it('checks a custom port', async () => {
    probe.mockResolvedValueOnce([]); // initial scan
    probe.mockResolvedValueOnce([{ port: 9999, online: true, latencyMs: 5 }]);
    render(<OmniRouteWidget />);
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(1));

    const input = document.getElementById('input-custom-port') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '9999');
    await userEvent.click(screen.getByRole('button', { name: 'Check Port' }));

    expect(probe).toHaveBeenLastCalledWith([9999]);
    expect(await screen.findByText('Online (5ms)')).toBeInTheDocument();
  });

  it('rejects invalid custom ports without calling the backend', async () => {
    probe.mockResolvedValue([]);
    render(<OmniRouteWidget />);
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(1));
    const input = screen.getByLabelText('Port to check');

    await userEvent.clear(input);
    await userEvent.click(screen.getByRole('button', { name: 'Check Port' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('between 1 and 65535');

    await userEvent.type(input, '99999');
    await userEvent.click(screen.getByRole('button', { name: 'Check Port' }));
    expect(screen.getByRole('alert')).toHaveTextContent('between 1 and 65535');

    await userEvent.clear(input);
    await userEvent.type(input, 'abc0');
    expect(input).toHaveValue('0');
    await userEvent.click(screen.getByRole('button', { name: 'Check Port' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it('reports a custom port with nothing listening as unreachable', async () => {
    probe.mockResolvedValueOnce([]);
    probe.mockResolvedValueOnce([{ port: 8000, online: false, latencyMs: null }]);
    render(<OmniRouteWidget />);
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: 'Check Port' }));
    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
  });
});
