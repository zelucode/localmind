import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './HomePage';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import { DEFAULT_BOOKMARKS } from '../data/defaultBookmarks';
import { StoredApiKey } from '../types';

const key = (over: Partial<StoredApiKey> = {}): StoredApiKey => ({
  id: 'k1',
  provider: 'gemini',
  providerName: 'Google Gemini',
  key: 'AIzaXXXXXXXXXXXX',
  label: 'Dev',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  ...over,
});

function setup(over: Partial<React.ComponentProps<typeof HomePage>> = {}) {
  const props = {
    tools: INITIAL_AI_TOOLS.map((t) => ({ ...t, isFavorite: false })),
    bookmarks: DEFAULT_BOOKMARKS.map((b) => ({ ...b, isFavorite: false })),
    keys: [] as StoredApiKey[],
    showScopeExplainer: true,
    onNavigate: vi.fn(),
    onOpenAdvisor: vi.fn(),
    ...over,
  };
  render(<HomePage {...props} />);
  return props;
}

describe('HomePage', () => {
  it('shows real counts', () => {
    setup();
    expect(screen.getByText(`${INITIAL_AI_TOOLS.length} cataloged`)).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_BOOKMARKS.length} saved`)).toBeInTheDocument();
  });

  it('prompts for a first key when the vault is empty', () => {
    setup();
    expect(screen.getByText('No keys yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first key')).toBeInTheDocument();
  });

  it('counts keys that have not been verified', () => {
    setup({ keys: [key({ id: 'a', lastTestedStatus: 'valid' }), key({ id: 'b' }), key({ id: 'c', lastTestedStatus: 'invalid' })] });
    expect(screen.getByText('3 keys')).toBeInTheDocument();
    expect(screen.getByText('2 not verified')).toBeInTheDocument();
  });

  it('says all keys are verified when they are', () => {
    setup({ keys: [key({ lastTestedStatus: 'valid' })] });
    expect(screen.getByText('1 key')).toBeInTheDocument();
    expect(screen.getByText('All verified')).toBeInTheDocument();
  });

  it.each([
    ['AI Tools', 'tools'],
    ['Bookmarks', 'bookmarks'],
    ['Key Vault', 'vault'],
    ['Runtimes', 'runtimes'],
  ] as const)('status card "%s" navigates to %s', async (title, view) => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${title}`) }));
    expect(props.onNavigate).toHaveBeenCalledWith(view);
  });

  it('does not claim runtime status it cannot know', () => {
    setup();
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument();
  });

  it('shows an empty-state hint when nothing is starred', () => {
    setup();
    expect(screen.getByText(/Star a tool or bookmark/)).toBeInTheDocument();
  });

  it('lists starred tools and bookmarks as links', () => {
    const tools = INITIAL_AI_TOOLS.map((t, i) => ({ ...t, isFavorite: i === 0 }));
    const bookmarks = DEFAULT_BOOKMARKS.map((b, i) => ({ ...b, isFavorite: i === 0 }));
    setup({ tools, bookmarks });
    expect(screen.getByRole('link', { name: new RegExp(tools[0].name) })).toHaveAttribute('href', tools[0].url);
    expect(screen.getByRole('link', { name: new RegExp(bookmarks[0].title) })).toHaveAttribute('href', bookmarks[0].url);
  });

  it('hides the scope explainer when the setting is off', () => {
    setup({ showScopeExplainer: false });
    expect(screen.queryByText(/Understanding AI Tool Scopes/)).not.toBeInTheDocument();
  });
});
