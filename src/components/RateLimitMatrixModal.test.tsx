import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { RATE_LIMIT_DATA } from '../data/providers';
import { RateLimitMatrixModal } from './RateLimitMatrixModal';

function setup(onOpenExporterWithProvider = vi.fn()) {
  render(<RateLimitMatrixModal inline isOpen onClose={() => {}} onOpenExporterWithProvider={onOpenExporterWithProvider} />);
  return { onOpenExporterWithProvider };
}

describe('RateLimitMatrixModal', () => {
  it('lists every provider', () => {
    setup();
    for (const row of RATE_LIMIT_DATA) {
      expect(screen.getByText(row.provider)).toBeInTheDocument();
    }
  });

  it('says which rows were checked and which were not', () => {
    setup();
    expect(screen.getAllByText(/Checked 2026-10/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Not re-checked/).length).toBeGreaterThan(0);
  });

  it('does not claim the quotas were verified live, and says they can change', () => {
    setup();
    expect(screen.queryByText(/verified active/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/change/i).length).toBeGreaterThan(0);
  });

  it('filters by category', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Local Offline' }));
    expect(screen.getByText('Local Ollama')).toBeInTheDocument();
    expect(screen.queryByText('Groq Cloud')).not.toBeInTheDocument();
  });

  it('searches by provider, model and role, and shows an empty state', async () => {
    setup();
    const box = screen.getByPlaceholderText(/search provider/i);
    await userEvent.type(box, 'autocomplete');
    expect(screen.getByText('Groq Cloud')).toBeInTheDocument();
    expect(screen.queryByText('Mistral AI')).not.toBeInTheDocument();
    await userEvent.clear(box);
    await userEvent.type(box, 'zzzz-nothing');
    expect(screen.getByText(/no providers match/i)).toBeInTheDocument();
  });

  it('opens the exporter for the clicked provider', async () => {
    const { onOpenExporterWithProvider } = setup();
    const row = screen.getByText('DeepSeek API').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: /config/i }));
    expect(onOpenExporterWithProvider).toHaveBeenCalledWith('deepseek');
  });

  it('opens the get-key link through openExternal', async () => {
    setup();
    const row = screen.getByText('Groq Cloud').closest('tr')!;
    await userEvent.click(within(row).getByTitle('Get API Key'));
    expect(openExternal).toHaveBeenCalledWith('https://console.groq.com/keys');
  });

  it('shows the rotation chain on the second tab', async () => {
    setup();
    await userEvent.click(screen.getAllByRole('button', { name: /rotation chain/i })[0]);
    expect(screen.getByText(/Tier 1: Big Context/)).toBeInTheDocument();
    expect(screen.getByText(/Tier 4: Offline Core/)).toBeInTheDocument();
  });
});
