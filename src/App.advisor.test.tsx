import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The Advisor is switched off by default; this file proves the switch brings it back.
vi.mock('./config/features', () => ({ FEATURES: { advisor: true } }));
vi.mock('./lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
}));

import App from './App';

beforeEach(() => {
  localStorage.setItem('ai_nexus_show_loading_v1', 'false');
  localStorage.setItem('ai_nexus_show_startup_v1', 'false');
});

describe('App with the Advisor enabled', () => {
  it('shows the floating button, the Omnibar button and the shortcut', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Ask Advisor/ })).toBeInTheDocument();
    expect(document.getElementById('btn-omnibar-advisor')).toBeInTheDocument();
    await userEvent.keyboard('?');
    expect(screen.getByText(/Architecture Advisor/)).toBeInTheDocument();
  });

  it('opens the Advisor from the button and from the "a" key', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /Ask Advisor/ }));
    expect(document.getElementById('modal-ai-advisor')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(document.getElementById('modal-ai-advisor')).not.toBeInTheDocument();
    await userEvent.keyboard('a');
    expect(document.getElementById('modal-ai-advisor')).toBeInTheDocument();
  });
});
