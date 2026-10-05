import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  askAdvisor: vi.fn(),
}));

import { askAdvisor } from '../lib/backend';
import { AIAdvisorModal } from './AIAdvisorModal';

const ask = vi.mocked(askAdvisor);
const placeholder = /Describe what you want to build/;

describe('AIAdvisorModal', () => {
  it('asks the user to add a Gemini key instead of calling the backend without one', async () => {
    render(<AIAdvisorModal isOpen onClose={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(placeholder), 'edit my repo for free');
    await userEvent.click(screen.getByRole('button', { name: /Consult Advisor/ }));

    expect(await screen.findByText(/Add a Gemini API key in the Key Vault/)).toBeInTheDocument();
    expect(ask).not.toHaveBeenCalled();
  });

  it('sends the question and the vault key, then shows the answer', async () => {
    ask.mockResolvedValue('Use Aider with a free Gemini key.');
    render(<AIAdvisorModal isOpen onClose={() => {}} geminiKey="AIzaTESTKEY" />);
    await userEvent.type(screen.getByPlaceholderText(placeholder), 'edit my repo for free');
    await userEvent.click(screen.getByRole('button', { name: /Consult Advisor/ }));

    expect(ask).toHaveBeenCalledWith('edit my repo for free', 'AIzaTESTKEY');
    expect(await screen.findByText('Use Aider with a free Gemini key.')).toBeInTheDocument();
  });

  it('shows the backend error message', async () => {
    ask.mockRejectedValue(new Error('Gemini rate limit reached. Wait a minute and try again.'));
    render(<AIAdvisorModal isOpen onClose={() => {}} geminiKey="AIzaTESTKEY" />);
    await userEvent.type(screen.getByPlaceholderText(placeholder), 'anything');
    await userEvent.click(screen.getByRole('button', { name: /Consult Advisor/ }));

    expect(await screen.findByText(/rate limit reached/)).toBeInTheDocument();
  });

  it('prefills the prompt from initialPrompt', () => {
    render(<AIAdvisorModal isOpen onClose={() => {}} initialPrompt="seeded question" />);
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue('seeded question');
  });
});
