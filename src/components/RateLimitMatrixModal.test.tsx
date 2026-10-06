import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { PROVIDER_PRESETS } from '../lib/configSnippet';
import { RATE_LIMIT_DATA, RateLimitMatrixModal } from './RateLimitMatrixModal';

function setup(onOpenExporterWithProvider = vi.fn()) {
  render(<RateLimitMatrixModal inline isOpen onClose={() => {}} onOpenExporterWithProvider={onOpenExporterWithProvider} />);
  return { onOpenExporterWithProvider };
}

describe('RATE_LIMIT_DATA', () => {
  it('has unique ids', () => {
    expect(new Set(RATE_LIMIT_DATA.map((r) => r.id)).size).toBe(RATE_LIMIT_DATA.length);
  });

  it('only offers a Config button for providers the exporter really has a preset for', () => {
    const presetIds = PROVIDER_PRESETS.map((p) => p.id);
    for (const row of RATE_LIMIT_DATA) {
      expect(presetIds, row.id).toContain(row.id);
    }
  });
});

describe('RateLimitMatrixModal', () => {
  it('lists every provider', () => {
    setup();
    for (const row of RATE_LIMIT_DATA) {
      expect(screen.getByText(row.provider)).toBeInTheDocument();
    }
  });

  it('does not claim the quotas were verified live, and says they can change', () => {
    setup();
    expect(screen.queryByText(/verified active/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/change/i).length).toBeGreaterThan(0);
  });

  it('filters by category', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Local Offline' }));
    expect(screen.getByText('Local Ollama / LM Studio')).toBeInTheDocument();
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
