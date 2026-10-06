import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddToolModal } from './AddToolModal';
import { AITool } from '../types';

const existing = { id: 'perplexity', name: 'Perplexity AI', url: 'https://www.perplexity.ai' } as AITool;

function setup(over: Partial<React.ComponentProps<typeof AddToolModal>> = {}) {
  const props = { isOpen: true, onClose: vi.fn(), onAddTool: vi.fn(), existingTools: [existing], ...over };
  const view = render(<AddToolModal {...props} />);
  return { ...props, rerender: (next: Partial<typeof props>) => view.rerender(<AddToolModal {...props} {...next} />) };
}

const name = () => document.getElementById('field-name') as HTMLInputElement;
const link = () => document.getElementById('field-url') as HTMLInputElement;
const submit = () => userEvent.click(document.getElementById('btn-submit-add-tool')!);

describe('AddToolModal', () => {
  it('adds a custom tool with a normalized https link and honest defaults', async () => {
    const props = setup();
    await userEvent.type(name(), '  Cohere  ');
    await userEvent.type(link(), 'cohere.com/chat');
    await submit();
    expect(props.onAddTool).toHaveBeenCalledOnce();
    const tool = vi.mocked(props.onAddTool).mock.calls[0][0] as AITool;
    expect(tool).toMatchObject({
      name: 'Cohere',
      url: 'https://cohere.com/chat',
      isCustom: true,
      description: 'Custom AI tool added by you.',
      tags: ['custom', 'ai-tool'],
    });
    // It does not claim anything about a free tier the user never described.
    expect(tool.freeTier.summary).toBe('No free-tier details added.');
    expect(tool.freeTier.freeCreditValue).toBe('Not specified');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('refuses a javascript: link and says why, without adding or closing', async () => {
    const props = setup();
    await userEvent.type(name(), 'Evil');
    await userEvent.type(link(), 'javascript:alert(1)');
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/only http/i);
    expect(props.onAddTool).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('checks the download link too', async () => {
    const props = setup();
    await userEvent.type(name(), 'X');
    await userEvent.type(link(), 'x.com');
    await userEvent.click(screen.getByRole('button', { name: /optional details/i }));
    await userEvent.type(screen.getByPlaceholderText(/download or github releases/i), 'file:///c:/x.exe');
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/download link/i);
    expect(props.onAddTool).not.toHaveBeenCalled();
  });

  it('warns when the link is already in the catalog', async () => {
    const props = setup();
    await userEvent.type(name(), 'Perplexity again');
    await userEvent.type(link(), 'perplexity.ai');
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('"Perplexity AI" already uses this link.');
    expect(props.onAddTool).not.toHaveBeenCalled();
  });

  it('starts empty every time it is opened (it used to keep the last tool\'s values)', async () => {
    const props = setup();
    await userEvent.type(name(), 'Left over');
    props.rerender({ isOpen: false });
    props.rerender({ isOpen: true });
    expect(name().value).toBe('');
    expect(link().value).toBe('');
  });

  it('needs only a name and a link, and explains what is missing', async () => {
    const props = setup();
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
    await userEvent.type(name(), 'Foo');
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/web address/i);
    expect(props.onAddTool).not.toHaveBeenCalled();
  });

  it('rejects too many tags and reveals the optional section to show the error', async () => {
    const props = setup();
    await userEvent.type(name(), 'Foo');
    await userEvent.type(link(), 'foo.com');
    await userEvent.click(screen.getByRole('button', { name: /optional details/i }));
    await userEvent.type(document.getElementById('field-tags')!, 'a,b,c,d,e,f,g,h,i');
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/at most 8 tags/i);
    expect(props.onAddTool).not.toHaveBeenCalled();
  });
});
