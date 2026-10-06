import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBookmarkModal } from './AddBookmarkModal';
import { ToolBookmark } from '../types';

const curated: ToolBookmark = {
  id: 'bm-1',
  title: 'JSON Crack',
  url: 'https://jsoncrack.com',
  description: 'Visualize JSON',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free Web Tool',
  tags: ['json'],
  createdAt: '2026-01-01',
  githubUrl: 'https://github.com/AykutSarac/jsoncrack.com',
  stars: 40000,
  license: 'Apache-2.0',
  isCustom: false,
  isFavorite: true,
  clickCount: 7,
};

function setup(over: Partial<React.ComponentProps<typeof AddBookmarkModal>> = {}) {
  const props = { isOpen: true, onClose: vi.fn(), onSaveBookmark: vi.fn(), existingBookmarks: [curated], ...over };
  render(<AddBookmarkModal {...props} />);
  return props;
}

const urlField = () => screen.getByPlaceholderText('https://example.com/tool') as HTMLInputElement;
const titleField = () => screen.getByPlaceholderText(/ray\.so/i) as HTMLInputElement;
const descField = () => screen.getByPlaceholderText(/what does this tool do/i);
const save = () => userEvent.click(document.querySelector('button[type="submit"]')!);

describe('AddBookmarkModal: adding', () => {
  it('saves a new custom bookmark with a normalized link and no invented "No Sign Up" claim', async () => {
    const props = setup();
    await userEvent.type(urlField(), 'regex101.com');
    fireEvent.blur(urlField());
    expect(urlField().value).toBe('https://regex101.com');
    expect(titleField().value).toBe('Regex101');
    await userEvent.type(descField(), 'Test regular expressions');
    await save();
    const saved = vi.mocked(props.onSaveBookmark).mock.calls[0][0] as ToolBookmark;
    expect(saved).toMatchObject({
      title: 'Regex101',
      url: 'https://regex101.com',
      isCustom: true,
      freeTierBadge: 'Free Web Tool',
    });
    expect(saved.freeTierBadge).not.toMatch(/no sign up/i);
  });

  it('refuses javascript:, ftp: and other non-web links', async () => {
    const props = setup();
    await userEvent.type(titleField(), 'Bad');
    await userEvent.type(descField(), 'x');
    await userEvent.type(urlField(), 'javascript:alert(1)');
    await save();
    expect(screen.getByText(/only http/i)).toBeInTheDocument();
    expect(props.onSaveBookmark).not.toHaveBeenCalled();
  });

  it('warns when the link is already bookmarked', async () => {
    const props = setup();
    await userEvent.type(titleField(), 'Again');
    await userEvent.type(descField(), 'x');
    await userEvent.type(urlField(), 'https://JSONCRACK.com/');
    await save();
    expect(screen.getByText('"JSON Crack" is already in your bookmarks with this link.')).toBeInTheDocument();
    expect(props.onSaveBookmark).not.toHaveBeenCalled();
  });
});

describe('AddBookmarkModal: editing', () => {
  it('keeps the GitHub link, stars, license, favorite flag and click count it does not show', async () => {
    const props = setup({ bookmarkToEdit: curated });
    await userEvent.clear(descField());
    await userEvent.type(descField(), 'Visualize JSON as graphs');
    await save();
    const saved = vi.mocked(props.onSaveBookmark).mock.calls[0][0] as ToolBookmark;
    expect(saved).toMatchObject({
      id: 'bm-1',
      description: 'Visualize JSON as graphs',
      githubUrl: curated.githubUrl,
      stars: 40000,
      license: 'Apache-2.0',
      isFavorite: true,
      clickCount: 7,
    });
  });

  it('does not turn a curated bookmark into a custom (deletable) one', async () => {
    const props = setup({ bookmarkToEdit: curated });
    await save();
    expect((vi.mocked(props.onSaveBookmark).mock.calls[0][0] as ToolBookmark).isCustom).toBe(false);
  });

  it('may keep its own link without being told it is a duplicate', async () => {
    const props = setup({ bookmarkToEdit: curated });
    await save();
    expect(props.onSaveBookmark).toHaveBeenCalledOnce();
  });
});
