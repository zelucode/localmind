import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  previewDiagnostics: vi.fn(),
  saveDiagnostics: vi.fn(),
  getLogInfo: vi.fn(),
}));
vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  revealInFolder: vi.fn(),
}));

import { BackendUnavailableError, revealInFolder } from '../lib/tauri';
import { getLogInfo, previewDiagnostics, saveDiagnostics } from '../lib/backend';
import { ReportProblemModal } from './ReportProblemModal';

const preview = vi.mocked(previewDiagnostics);
const save = vi.mocked(saveDiagnostics);
const info = vi.mocked(getLogInfo);
const reveal = vi.mocked(revealInFolder);

const TEXT = 'LocalMind diagnostics\nApp version: 0.1.0\n--- app.log (last 1 lines) ---\n2026-10-07T09:30:00Z INFO  [backend] started\n';

beforeEach(() => {
  for (const m of [preview, save, info, reveal]) m.mockReset();
  preview.mockResolvedValue(TEXT);
  info.mockResolvedValue({ dir: 'C:/logs', file: 'C:/logs/app.log' });
  reveal.mockResolvedValue(undefined);
});

describe('ReportProblemModal', () => {
  it('renders nothing when closed and asks the backend nothing', () => {
    render(<ReportProblemModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(preview).not.toHaveBeenCalled();
  });

  it('shows exactly what would be saved, and says nothing is sent', async () => {
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    expect(await screen.findByLabelText('Preview of the file')).toHaveValue(TEXT);
    expect(screen.getByText(/Nothing is sent anywhere/)).toBeInTheDocument();
    expect(screen.getByText(/does not contain your keys/)).toBeInTheDocument();
  });

  it('saves the file, shows where it went, and reveals it in the folder', async () => {
    save.mockResolvedValue('C:/Users/me/Downloads/localmind-diagnostics-20261007-093000.txt');
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    await screen.findByLabelText('Preview of the file');
    await userEvent.click(screen.getByRole('button', { name: /Save diagnostic file/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved to C:/Users/me/Downloads/localmind-diagnostics-20261007-093000.txt');
    await userEvent.click(screen.getByRole('button', { name: 'Show in folder' }));
    expect(reveal).toHaveBeenCalledWith('C:/Users/me/Downloads/localmind-diagnostics-20261007-093000.txt');
  });

  it('reports a failed save instead of claiming success', async () => {
    save.mockRejectedValue(new Error('Could not save the file: disk full'));
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    await screen.findByLabelText('Preview of the file');
    await userEvent.click(screen.getByRole('button', { name: /Save diagnostic file/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('disk full');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('opens the log folder at app.log', async () => {
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    await screen.findByLabelText('Preview of the file');
    const button = screen.getByRole('button', { name: /Open log folder/ });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(reveal).toHaveBeenCalledWith('C:/logs/app.log');
  });

  it('copies the text and reports a clipboard that refuses', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    await screen.findByLabelText('Preview of the file');
    await userEvent.click(screen.getByRole('button', { name: /Copy text/ }));
    expect(await screen.findByRole('button', { name: /Copy failed/ })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(TEXT);
  });

  it('in a plain browser says it needs the desktop app and offers nothing to save', async () => {
    preview.mockRejectedValue(new BackendUnavailableError('Diagnostics'));
    info.mockRejectedValue(new BackendUnavailableError('The log folder'));
    render(<ReportProblemModal isOpen onClose={() => {}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Diagnostics needs the LocalMind desktop app.');
    expect(screen.getByRole('button', { name: /Save diagnostic file/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Open log folder/ })).toBeDisabled();
  });

  it('closes from the X and the backdrop, not from a click inside', async () => {
    const onClose = vi.fn();
    render(<ReportProblemModal isOpen onClose={onClose} />);
    await screen.findByLabelText('Preview of the file');
    await userEvent.click(screen.getByText('What the file contains'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(document.getElementById('modal-report-problem')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
